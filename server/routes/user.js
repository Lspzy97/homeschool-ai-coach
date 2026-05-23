const express = require('express');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const router = express.Router();

const USERS_FILE = path.join(__dirname, '..', 'data', 'users.json');

// 确保数据文件存在
function ensureUsersFile() {
  if (!fs.existsSync(USERS_FILE)) {
    fs.writeFileSync(USERS_FILE, JSON.stringify([]));
  }
}

// 读取用户列表
function getUsers() {
  ensureUsersFile();
  try {
    return JSON.parse(fs.readFileSync(USERS_FILE, 'utf-8'));
  } catch (e) {
    return [];
  }
}

// 保存用户列表
function saveUsers(users) {
  ensureUsersFile();
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
}

// 生成会话token
function generateToken(openid) {
  const timestamp = Date.now();
  const random = crypto.randomBytes(16).toString('hex');
  return crypto.createHash('sha256').update(`${openid}:${timestamp}:${random}`).digest('hex');
}

/**
 * POST /api/user/wxlogin
 * 微信授权登录
 */
router.post('/wxlogin', async (req, res) => {
  try {
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({ success: false, error: '缺少 code' });
    }

    // 调用微信接口获取 openid
    // 注意：生产环境需要配置 AppID 和 AppSecret
    const appId = process.env.WECHAT_APPID;
    const appSecret = process.env.WECHAT_APPSECRET;

    if (!appId || !appSecret) {
      // 测试模式：使用 code 作为 openid
      const openid = 'test_' + code;
      const token = generateToken(openid);
      const users = getUsers();
      let user = users.find(u => u.openid === openid);

      if (!user) {
        user = {
          openid,
          token,
          createdAt: new Date().toISOString(),
          isVip: false,
          vipLevel: null,
          expireDate: null
        };
        users.push(user);
      } else {
        user.token = token;
        user.lastLoginAt = new Date().toISOString();
      }

      saveUsers(users);

      return res.json({
        success: true,
        data: {
          token,
          openid,
          isVip: user.isVip,
          isNew: !user.lastLoginAt
        }
      });
    }

    // 正式模式：调用微信接口
    const wxUrl = `https://api.weixin.qq.com/sns/jscode2session?appid=${appId}&secret=${appSecret}&js_code=${code}&grant_type=authorization_code`;

    const wxResponse = await fetch(wxUrl);
    const wxData = await wxResponse.json();

    if (wxData.errcode) {
      console.error('微信登录失败:', wxData);
      return res.status(400).json({ success: false, error: '微信登录失败' });
    }

    const openid = wxData.openid;
    const token = generateToken(openid);

    // 保存或更新用户
    const users = getUsers();
    let user = users.find(u => u.openid === openid);

    if (!user) {
      user = {
        openid,
        sessionKey: wxData.session_key,
        token,
        createdAt: new Date().toISOString(),
        isVip: false,
        vipLevel: null,
        expireDate: null
      };
      users.push(user);
    } else {
      user.sessionKey = wxData.session_key;
      user.token = token;
      user.lastLoginAt = new Date().toISOString();
    }

    saveUsers(users);

    res.json({
      success: true,
      data: {
        token,
        openid,
        isVip: user.isVip,
        isNew: !user.lastLoginAt
      }
    });
  } catch (error) {
    console.error('登录失败:', error);
    res.status(500).json({ success: false, error: '登录失败' });
  }
});

/**
 * GET /api/user/info
 * 获取用户信息
 */
router.get('/info', (req, res) => {
  try {
    const token = req.headers['authorization'] || req.query.token;

    if (!token) {
      return res.status(401).json({ success: false, error: '未登录' });
    }

    const users = getUsers();
    const user = users.find(u => u.token === token);

    if (!user) {
      return res.status(401).json({ success: false, error: '登录已过期' });
    }

    res.json({
      success: true,
      data: {
        openid: user.openid,
        isVip: user.isVip,
        vipLevel: user.vipLevel,
        expireDate: user.expireDate,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: '查询失败' });
  }
});

/**
 * GET /api/user/check
 * 检查登录状态
 */
router.get('/check', (req, res) => {
  try {
    const token = req.headers['authorization'] || req.query.token;

    if (!token) {
      return res.json({ success: true, data: { loggedIn: false } });
    }

    const users = getUsers();
    const user = users.find(u => u.token === token);

    if (!user) {
      return res.json({ success: true, data: { loggedIn: false } });
    }

    res.json({
      success: true,
      data: {
        loggedIn: true,
        openid: user.openid,
        isVip: user.isVip
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: '查询失败' });
  }
});

module.exports = router;