const express = require('express');
const fs = require('fs');
const path = require('path');

const router = express.Router();

// 会员数据文件路径
const MEMBERS_FILE = path.join(__dirname, '..', 'data', 'members.json');

// 确保数据文件存在
function ensureMembersFile() {
  if (!fs.existsSync(MEMBERS_FILE)) {
    fs.writeFileSync(MEMBERS_FILE, JSON.stringify([]));
  }
}

// 读取会员列表
function getMembers() {
  ensureMembersFile();
  try {
    return JSON.parse(fs.readFileSync(MEMBERS_FILE, 'utf-8'));
  } catch (e) {
    return [];
  }
}

// 保存会员列表
function saveMembers(members) {
  ensureMembersFile();
  fs.writeFileSync(MEMBERS_FILE, JSON.stringify(members, null, 2));
}

// 暴露给其他模块使用
module.exports.getMembers = getMembers;
module.exports.saveMembers = saveMembers;

/**
 * 检查用户是否为VIP
 * @param {string} openid
 * @returns {boolean}
 */
module.exports.isVip = function(openid) {
  if (!openid) return false;
  const members = getMembers();
  const member = members.find(m => m.openid === openid);
  if (!member) return false;
  // 永久会员永不过期
  if (member.vipLevel === 'permanent') return true;
  if (member.expireDate) {
    const expireDate = new Date(member.expireDate);
    if (expireDate < new Date()) return false;
  }
  return true;
};

/**
 * 外部调用：开通/续费会员
 * @param {string} expireDate
 * @param {array} features
 */
module.exports.upgradeMember = function(openid, vipLevel, expireDate, features) {
  const members = getMembers();
  const existingIndex = members.findIndex(m => m.openid === openid);

  // 根据vipLevel计算过期时间
  let finalExpireDate = expireDate;
  if (!finalExpireDate) {
    if (vipLevel === 'permanent') {
      finalExpireDate = '2099-12-31T23:59:59.999Z';
    } else if (vipLevel === 'yearly') {
      finalExpireDate = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();
    } else {
      finalExpireDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    }
  }

  const memberData = {
    openid,
    vipLevel: vipLevel || 'monthly',
    expireDate: finalExpireDate,
    features: features || ['unlimited_analysis', 'save_persons', 'history_backup', 'satir_analysis', 'mbti_deep', 'warning_zone', 'emotion_triggers', 'relationship_stage', 'psychology_effects'],
    createdAt: existingIndex >= 0 ? members[existingIndex].createdAt : new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  if (existingIndex >= 0) {
    members[existingIndex] = { ...members[existingIndex], ...memberData };
  } else {
    members.push(memberData);
  }

  saveMembers(members);
  return memberData;
};

/**
 * GET /api/member/check
 * 查询会员状态（通过 openid）
 */
router.get('/check', (req, res) => {
  try {
    const { openid } = req.query;
    if (!openid) {
      return res.status(400).json({ success: false, error: '缺少 openid' });
    }

    const members = getMembers();
    const member = members.find(m => m.openid === openid);

    if (!member) {
      // 未开通会员
      return res.json({
        success: true,
        data: {
          isVip: false,
          vipLevel: null,
          expireDate: null,
          features: []
        }
      });
    }

    // 永久会员永不过期
    if (member.vipLevel === 'permanent') {
      return res.json({
        success: true,
        data: {
          isVip: true,
          vipLevel: 'permanent',
          expireDate: '永久有效',
          features: member.features || [],
          memberSince: member.createdAt
        }
      });
    }

    // 检查是否过期
    const now = new Date();
    const expireDate = new Date(member.expireDate);
    const isExpired = expireDate < now;

    if (isExpired) {
      return res.json({
        success: true,
        data: {
          isVip: false,
          vipLevel: null,
          expireDate: member.expireDate,
          features: [],
          message: '会员已过期'
        }
      });
    }

    return res.json({
      success: true,
      data: {
        isVip: true,
        vipLevel: member.vipLevel,
        expireDate: member.expireDate,
        features: member.features || [],
        memberSince: member.createdAt
      }
    });
  } catch (error) {
    console.error('查询会员失败:', error);
    res.status(500).json({ success: false, error: '查询失败' });
  }
});

/**
 * POST /api/member/upgrade
 * 开通/续费会员
 * Body: { openid, vipLevel, expireDate, features }
 */
router.post('/upgrade', (req, res) => {
  try {
    const { openid, vipLevel, features } = req.body;

    if (!openid) {
      return res.status(400).json({ success: false, error: '缺少 openid' });
    }

    const members = getMembers();
    const existingIndex = members.findIndex(m => m.openid === openid);

    // 根据vipLevel计算过期时间
    let finalExpireDate;
    if (vipLevel === 'permanent') {
      finalExpireDate = '2099-12-31T23:59:59.999Z';
    } else if (vipLevel === 'yearly') {
      finalExpireDate = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();
    } else {
      finalExpireDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    }

    const memberData = {
      openid,
      vipLevel: vipLevel || 'monthly',
      expireDate: finalExpireDate,
      features: features || ['unlimited_analysis', 'save_persons', 'history_backup', 'satir_analysis', 'mbti_deep', 'warning_zone', 'emotion_triggers', 'relationship_stage', 'psychology_effects'],
      createdAt: existingIndex >= 0 ? members[existingIndex].createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    if (existingIndex >= 0) {
      members[existingIndex] = { ...members[existingIndex], ...memberData };
    } else {
      members.push(memberData);
    }

    saveMembers(members);

    res.json({
      success: true,
      data: {
        isVip: true,
        vipLevel: memberData.vipLevel,
        expireDate: memberData.expireDate,
        features: memberData.features
      }
    });
  } catch (error) {
    console.error('开通会员失败:', error);
    res.status(500).json({ success: false, error: '开通失败' });
  }
});

/**
 * GET /api/member/admin/list
 * 管理员查看所有会员（简单防护）
 */
router.get('/admin/list', (req, res) => {
  try {
    const { key } = req.query;
    // 简单密钥保护，实际生产环境需要更强的鉴权
    if (key !== 'lzmzzy2026') {
      return res.status(403).json({ success: false, error: '无权限' });
    }

    const members = getMembers();
    // 脱敏处理，不返回完整openid
    const sanitized = members.map(m => ({
      ...m,
      openid: m.openid.substring(0, 8) + '***',
      createdAt: m.createdAt,
      updatedAt: m.updatedAt
    }));

    res.json({
      success: true,
      data: sanitized,
      total: members.length
    });
  } catch (error) {
    res.status(500).json({ success: false, error: '查询失败' });
  }
});

/**
 * GET /api/member/benefits
 * 获取会员权益说明
 */
router.get('/benefits', (req, res) => {
  res.json({
    success: true,
    data: {
      free: {
        name: '免费版',
        analysisLimit: 5,      // 每天分析次数
        personLimit: 3,        // 保存分析对象数量
        historyDays: 7,       // 历史记录保存天数
        replyOptions: 3,      // 推荐回复条数
        features: ['basic_analysis', 'simple_reply']
      },
      vip: {
        name: '会员版',
        analysisLimit: -1,     // 不限
        personLimit: -1,       // 不限
        historyDays: -1,        // 永久
        replyOptions: 10,      // 推荐回复10条
        features: [
          'unlimited_analysis',
          'save_persons',
          'history_backup',
          'advanced_reply',
          'satir_analysis',
          'mbti_deep',
          'priority_support'
        ]
      }
    }
  });
});

module.exports = router;
