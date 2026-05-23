const express = require('express');
const multer = require('multer');
const path = require('path');
const router = express.Router();
const https = require('https');
const crypto = require('crypto');
const fs = require('fs');

// 阿里云OCR配置 - 从环境变量读取
const ALIYUN_ACCESS_KEY_ID = process.env.ALIYUN_ACCESS_KEY_ID || '';
const ALIYUN_ACCESS_KEY_SECRET = process.env.ALIYUN_ACCESS_KEY_SECRET || '';

// 文件上传配置
const upload = multer({
  dest: path.join(__dirname, '..', '..', 'data', 'uploads'),
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB
});

// 确保上传目录存在
const uploadDir = path.join(__dirname, '..', '..', 'data', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

/**
 * 生成阿里云API签名
 */
function generateSignature(params, secret) {
  const sortedParams = Object.keys(params).sort().map(k => k + '=' + params[k]).join('&');
  const stringToSign = sortedParams;
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(stringToSign);
  return hmac.digest('base64');
}

/**
 * 识别图片文字（使用阿里云OCR API）
 */
async function recognizeByOCR(imagePath) {
  return new Promise((resolve, reject) => {
    // 读取图片文件
    const imageBuffer = fs.readFileSync(imagePath);
    const base64Image = imageBuffer.toString('base64');

    const requestBody = JSON.stringify({
      image: base64Image
    });

    const options = {
      hostname: 'ocrapi.cn-shanghai.aliyuncs.com',
      port: 443,
      path: '/api/predict/ocr_v1',
      method: 'POST',
      headers: {
        'Authorization': 'APPCODE ' + ALIYUN_ACCESS_KEY_ID,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(requestBody)
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          console.log('OCR结果:', result);
          if (result.predictions && result.predictions[0]) {
            resolve(result.predictions[0].values.join('\n'));
          } else if (result.content) {
            resolve(result.content);
          } else {
            resolve('[无法识别图片中的文字]');
          }
        } catch(e) {
          console.error('OCR解析失败:', e.message, data);
          resolve('[识别失败，请手动输入文字]');
        }
      });
    });

    req.on('error', (e) => {
      console.error('OCR请求失败:', e.message);
      resolve('[网络错误，请手动输入文字]');
    });

    req.write(requestBody);
    req.end();
  });
}

/**
 * POST /api/recognize
 * 图片文字识别
 */
router.post('/recognize', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.json({ success: false, error: '请上传图片' });
    }

    console.log('收到图片识别请求:', req.file.originalname);

    // 识别图片文字
    const text = await recognizeByOCR(req.file.path);

    // 删除临时文件
    try {
      fs.unlinkSync(req.file.path);
    } catch(e) {}

    res.json({
      success: true,
      text: text
    });
  } catch (error) {
    console.error('识别失败:', error);
    res.json({
      success: false,
      error: error.message || '识别失败'
    });
  }
});

module.exports = router;