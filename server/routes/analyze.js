const express = require('express');
const AIService = require('../services/aiService');
const memberModule = require('./member');
const fs = require('fs');
const path = require('path');

const router = express.Router();

// 数据目录和文件路径
const DATA_DIR = path.join(__dirname, '..', '..', 'data');
const PERSONS_FILE = path.join(DATA_DIR, 'persons.json');
const ANALYSES_FILE = path.join(DATA_DIR, 'analyses.json');

// 确保数据目录存在
function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

// 检查用户是否为VIP（使用member模块）
function isVipUser(openid) {
  return memberModule.isVip(openid);
}

// 获取用户的今日分析次数
function getUserAnalysisCount(openid) {
  if (!openid) return 0;
  ensureDataDir();
  if (!fs.existsSync(ANALYSES_FILE)) {
    return 0;
  }
  try {
    const analyses = JSON.parse(fs.readFileSync(ANALYSES_FILE, 'utf-8'));
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return analyses.filter(a => a.openid === openid && new Date(a.createdAt) >= today).length;
  } catch(e) {
    return 0;
  }
}

// 获取用户已使用的深度分析试用次数（只看satr和mbti分析）
function getTrialCount(openid) {
  if (!openid) return 0;
  ensureDataDir();
  if (!fs.existsSync(ANALYSES_FILE)) {
    return 0;
  }
  try {
    const analyses = JSON.parse(fs.readFileSync(ANALYSES_FILE, 'utf-8'));
    // 统计该用户使用了萨提亚和MBTI深度分析的次数
    return analyses.filter(a => a.openid === openid && a.result && (a.result.satirDesc || a.result.mbtiDesc)).length;
  } catch(e) {
    return 0;
  }
}

// 读取人员列表
function getPersons() {
  ensureDataDir();
  if (!fs.existsSync(PERSONS_FILE)) {
    return [];
  }
  try {
    return JSON.parse(fs.readFileSync(PERSONS_FILE, 'utf-8'));
  } catch(e) {
    return [];
  }
}

// 保存人员列表
function savePersons(persons) {
  ensureDataDir();
  fs.writeFileSync(PERSONS_FILE, JSON.stringify(persons, null, 2));
}

// 读取分析记录
function getAnalyses() {
  ensureDataDir();
  if (!fs.existsSync(ANALYSES_FILE)) {
    return [];
  }
  try {
    return JSON.parse(fs.readFileSync(ANALYSES_FILE, 'utf-8'));
  } catch(e) {
    return [];
  }
}

// 保存分析记录
function saveAnalyses(analyses) {
  ensureDataDir();
  fs.writeFileSync(ANALYSES_FILE, JSON.stringify(analyses, null, 2));
}

// 计算置信度
function calculateConfidence(currentType, newType, currentConfidence, analysisCount) {
  if (!currentType || !currentConfidence) {
    // 首次分析
    return {
      type: newType,
      confidence: 20,
      isStable: false
    };
  }

  if (currentType === newType) {
    // 属性一致，增加置信度
    const newConfidence = Math.min(currentConfidence + 20, 90);
    const isStable = analysisCount >= 3 && newConfidence >= 70;
    return {
      type: newType,
      confidence: newConfidence,
      isStable
    };
  } else {
    // 属性变化，降低置信度
    const newConfidence = Math.max(currentConfidence - 10, 20);
    return {
      type: newType,
      confidence: newConfidence,
      isStable: false
    };
  }
}

/**
 * POST /api/analyze
 * 分析消息，返回属性判断和回复选项
 */
router.post('/analyze', async (req, res) => {
  try {
    const { userMessage, userText, recipientType, gender, personId, personName, openid } = req.body;

    if (!userMessage && !userText) {
      return res.status(400).json({
        success: false,
        error: '请提供对方的消息内容'
      });
    }

    // 检查是否为VIP用户
    const isVip = isVipUser(openid);
    const isVipUser = isVip; // 兼容

    // 如果不是VIP，检查分析次数限制（每天5次）
    if (!isVipUser) {
      const todayCount = getUserAnalysisCount(openid);
      if (todayCount >= 5) {
        return res.status(403).json({
          success: false,
          error: '今日分析次数已用完，请开通会员继续使用',
          code: 'LIMIT_EXCEEDED',
          isVip: false
        });
      }
    }

    console.log('收到分析请求:', {
      userMessageLength: userMessage?.length || 0,
      recipientType: recipientType || '家长',
      personName: personName || '',
      isVip: isVipUser
    });

    // 获取该人员的分析历史
    let personHistory = [];
    if (personId) {
      const analyses = getAnalyses();
      personHistory = analyses
        .filter(a => a.personId === personId)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 10); // 最近10条
    }

    // 调用AI服务，传入历史记录
    const result = await AIService.analyze(
      userMessage || '',
      userText || '',
      recipientType || '家长',
      gender || '男',
      personId || '',
      personHistory
    );

    // 计算并更新置信度
    let person = null;
    if (personId || personName) {
      const persons = getPersons();
      const existingPerson = persons.find(p => p.id === personId || p.name === personName);

      if (existingPerson) {
        const { type, confidence, isStable } = calculateConfidence(
          existingPerson.currentType,
          result.qingzhiType,
          existingPerson.confidence || 0,
          existingPerson.analysisCount || 0
        );

        existingPerson.currentType = type;
        existingPerson.confidence = confidence;
        existingPerson.isStable = isStable;
        existingPerson.analysisCount = (existingPerson.analysisCount || 0) + 1;
        existingPerson.lastAnalysis = {
          qingzhiType: result.qingzhiType,
          mbtiType: result.mbtiType,
          satirStance: result.satirStance,
          createdAt: new Date().toISOString()
        };
        person = existingPerson;
        savePersons(persons);
      } else if (personName) {
        // 创建新人
        const newPerson = {
          id: 'p_' + Date.now(),
          name: personName,
          gender: gender || '男',
          recipientType: recipientType || '家长',
          currentType: result.qingzhiType,
          confidence: 20,
          isStable: false,
          analysisCount: 1,
          createdAt: new Date().toISOString(),
          lastAnalysis: {
            qingzhiType: result.qingzhiType,
            mbtiType: result.mbtiType,
            satirStance: result.satirStance,
            createdAt: new Date().toISOString()
          }
        };
        persons.push(newPerson);
        savePersons(persons);
        person = newPerson;
      }

      // 保存分析记录
      const analyses = getAnalyses();
      analyses.push({
        id: 'a_' + Date.now(),
        openid: openid, // 保存用户ID用于统计
        personId: person ? person.id : personId,
        personName: personName || person?.name || '',
        userMessage,
        result,
        qingzhiType: result.qingzhiType,
        mbtiType: result.mbtiType,
        attachmentType: result.attachmentType,
        satirStance: result.satirStance,
        eqLevel: result.eqLevel,
        sdtNeed: result.sdtNeed,
        confidence: person?.confidence || 20,
        createdAt: new Date().toISOString()
      });
      saveAnalyses(analyses);
    }

    // 免费用户只返回3条回复，会员返回全部（最多10条）
    let replyOptions = result.replyOptions || [];
    if (!isVipUser && replyOptions.length > 3) {
      replyOptions = replyOptions.slice(0, 3);
    }

    // 免费用户萨提亚和MBTI深度分析：只有2次试用机会
    // 会员：无限次完整分析
    let satirDesc = result.satirDesc || '';
    let mbtiDesc = result.mbtiDesc || '';
    let satirStance = result.satirStance || '';
    let mbtiType = result.mbtiType || '';
    let trialCount = 0;
    let canTrial = false;

    if (!isVipUser) {
      trialCount = getTrialCount(openid);
      if (trialCount >= 2) {
        // 已用完试用次数，隐藏深度分析，显示引导开通
        satirDesc = '';
        mbtiDesc = '';
        // 保留类型名称但不显示详细描述
        satirStance = result.satirStance ? '[会员可见]' : '';
        mbtiType = result.mbtiType ? '[会员可见]' : '';
      } else {
        // 还在试用次数内，标记为试用
        canTrial = true;
      }
    }

    res.json({
      success: true,
      data: {
        ...result,
        replyOptions,
        satirDesc,
        mbtiDesc,
        satirStance,
        mbtiType,
        confidence: person?.confidence || result.confidence || 20,
        isStable: person?.isStable || false,
        isVip: isVipUser,
        remainCount: isVipUser ? -1 : (5 - getUserAnalysisCount(openid)),
        trialRemaining: isVipUser ? -1 : Math.max(0, 2 - trialCount),
        canTrial: canTrial,
        // VIP专属字段
        warningZone: isVipUser ? (result.warningZone || '') : '',
        emotionTriggers: isVipUser ? (result.emotionTriggers || '') : '',
        relationshipStage: isVipUser ? (result.relationshipStage || '') : '',
        psychologyEffects: isVipUser ? (result.psychologyEffects || '') : ''
      }
    });
  } catch (error) {
    console.error('分析失败:', error);
    res.status(500).json({
      success: false,
      error: error.message || '分析失败，请稍后重试'
    });
  }
});

module.exports = router;