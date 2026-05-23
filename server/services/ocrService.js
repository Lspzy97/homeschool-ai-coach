// 阿里云OCR服务 - 直接HTTP调用
const https = require('https');
const crypto = require('crypto');

// 从环境变量读取阿里云OCR配置
const ALIYUN_ACCESS_KEY_ID = process.env.ALIYUN_ACCESS_KEY_ID || '';
const ALIYUN_ACCESS_KEY_SECRET = process.env.ALIYUN_ACCESS_KEY_SECRET || '';

/**
 * 生成阿里云API签名
 */
function generateSignature(params, secret) {
  const stringToSign = 'GET\n' +
    '/api/predict/ocr_v1' + '\n' +
    'APPCODE ' + ALIYUN_ACCESS_KEY_ID + '\n' +
    Object.keys(params).sort().map(k => k + '=' + params[k]).join('&');

  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(stringToSign);
  return new Buffer(secret + ':' + hmac.digest('base64')).toString('base64');
}

/**
 * 识别图片文字
 * @param {string} imageUrl - 图片URL或Base64
 * @returns {Promise<string>} - 识别出的文字
 */
function recognizeText(imageUrl) {
  return new Promise((resolve, reject) => {
    // 如果是URL，直接构造请求
    const isUrl = imageUrl.startsWith('http');

    const postData = JSON.stringify({
      inputs: [
        {
          input: isUrl ? { image: imageUrl } : { image: { dataType: 50, dataValue: imageUrl } }
        }
      ]
    });

    const options = {
      hostname: 'ocrapi.cn-shanghai.aliyuncs.com',
      port: 443,
      path: '/api/predict/ocr_v1',
      method: 'POST',
      headers: {
        'Authorization': 'APPCODE ' + ALIYUN_ACCESS_KEY_ID,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          if (result.predictions && result.predictions[0]) {
            resolve(result.predictions[0].values.join('\n'));
          } else {
            resolve('');
          }
        } catch(e) {
          // OCR可能格式不同，尝试其他解析方式
          if (data.includes('text') || data.includes('content')) {
            try {
              const parsed = JSON.parse(data);
              resolve(JSON.stringify(parsed));
            } catch(e2) {
              resolve(data);
            }
          } else {
            resolve('');
          }
        }
      });
    });

    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

/**
 * 识别图片中的文字（备用方法，用阿里云通用OCR）
 */
async function recognizeImageText(imageUrl) {
  try {
    // 尝试OCR API
    const text = await recognizeText(imageUrl);
    if (text) return text;

    // 如果失败，返回提示
    return '[图片文字识别失败，请手动输入图片中的文字]';
  } catch(e) {
    console.error('OCR识别失败:', e.message);
    return '[图片文字识别失败，请手动输入图片中的文字]';
  }
}

module.exports = {
  recognizeText,
  recognizeImageText
};