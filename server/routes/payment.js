const express = require('express');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const WxPay = require('wechatpay-node-v3');
const config = require('../config');
const members = require('./member');

const router = express.Router();

// 初始化微信支付SDK
let wp = null;
if (config.wechatpay.mchId && config.wechatpay.appId && config.wechatpay.privateKey) {
  wp = new WxPay({
    mchid: config.wechatpay.mchId,
    serial: config.wechatpay.serialNo,
    privateKey: fs.readFileSync(config.wechatpay.privateKey),
    publicKey: fs.readFileSync(config.wechatpay.publicKey),
    apiKey: config.wechatpay.apiKey,
    appid: config.wechatpay.appId,
  });
}

/**
 * POST /api/payment/native
 * Native支付下单 - 商户号方案A
 */
router.post('/native', async (req, res) => {
  try {
    const { openid, description } = req.body;

    if (!wp) {
      return res.status(500).json({ success: false, error: '微信支付未配置，请检查商户号信息' });
    }

    if (!openid) {
      return res.status(400).json({ success: false, error: '缺少 openid' });
    }

    // 生成订单号
    const outTradeNo = 'VIP' + Date.now() + Math.random().toString(36).substr(2, 6);
    const total = Math.round(config.vip.price * 100); // 转换为分

    // 调用微信Native下单接口
    const result = await wp.native({
      description: description || config.vip.description,
      amount: {
        total,
        currency: 'CNY'
      },
      payer: {
        openid
      },
      notify_url: config.wechatpay.notifyUrl,
      out_trade_no: outTradeNo
    });

    res.json({
      success: true,
      data: {
        codeUrl: result.code_url,
        tradeNo: outTradeNo
      }
    });
  } catch (error) {
    console.error('Native支付下单失败:', error.message);
    res.status(500).json({ success: false, error: '支付下单失败: ' + error.message });
  }
});

/**
 * POST /api/payment/jsapi
 * JSAPI支付下单 - 适用于小程序
 */
router.post('/jsapi', async (req, res) => {
  try {
    const { openid } = req.body;

    if (!wp) {
      return res.status(500).json({ success: false, error: '微信支付未配置' });
    }

    if (!openid) {
      return res.status(400).json({ success: false, error: '缺少 openid' });
    }

    const outTradeNo = 'VIP' + Date.now() + Math.random().toString(36).substr(2, 6);
    const total = Math.round(config.vip.price * 100);

    const result = await wp.jsapi({
      description: config.vip.description,
      amount: {
        total,
        currency: 'CNY'
      },
      payer: {
        openid
      },
      notify_url: config.wechatpay.notifyUrl,
      out_trade_no: outTradeNo
    });

    res.json({
      success: true,
      data: {
        prepayId: result.prepay_id,
        tradeNo: outTradeNo
      }
    });
  } catch (error) {
    console.error('JSAPI支付下单失败:', error.message);
    res.status(500).json({ success: false, error: '支付下单失败' });
  }
});

/**
 * POST /api/payment/callback
 * 微信支付回调通知
 */
router.post('/callback', async (req, res) => {
  try {
    // 获取微信支付回调的头信息
    const wechatpaySignature = req.headers['wechatpay-signature'];
    const wechatpayTimestamp = req.headers['wechatpay-timestamp'];
    const wechatpayNonce = req.headers['wechatpay-nonce'];
    const wechatpaySerial = req.headers['wechatpay-serial'];

    if (!wechatpaySignature || !wechatpayTimestamp || !wechatpayNonce) {
      console.error('缺少微信支付签名头');
      return res.status(400).json({ code: 'FAIL', message: '签名验证失败' });
    }

    const body = req.body;
    console.log('收到微信支付回调:', JSON.stringify(body));

    // 处理支付成功事件
    if (body.event_type === 'TRANSACTION.SUCCESS') {
      const resource = body.resource;
      const attach = JSON.parse(resource.attach);

      if (attach.type === 'vip') {
        const openid = attach.openid;
        const expireDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

        // 调用 member.js 中的升级方法
        const membersList = members.getMembers();
        const existingIndex = membersList.findIndex(m => m.openid === openid);

        const memberData = {
          openid,
          vipLevel: 'monthly',
          expireDate,
          features: [
            'unlimited_analysis',
            'save_persons',
            'history_backup',
            'advanced_reply',
            'satir_analysis',
            'mbti_deep',
            'priority_support'
          ],
          createdAt: existingIndex >= 0 ? membersList[existingIndex].createdAt : new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        if (existingIndex >= 0) {
          membersList[existingIndex] = { ...membersList[existingIndex], ...memberData };
        } else {
          membersList.push(memberData);
        }

        members.saveMembers(membersList);
        console.log(`会员开通成功: ${openid}`);
      }
    }

    // 返回成功接收
    res.json({ code: 'SUCCESS', message: '成功' });
  } catch (error) {
    console.error('支付回调处理失败:', error);
    res.status(500).json({ code: 'FAIL', message: '处理失败' });
  }
});

/**
 * GET /api/payment/query/:tradeNo
 * 查询订单状态
 */
router.get('/query/:tradeNo', async (req, res) => {
  try {
    const { tradeNo } = req.params;

    if (!wp) {
      return res.status(500).json({ success: false, error: '微信支付未配置' });
    }

    const result = await wp.query({ out_trade_no: tradeNo });

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('查询订单失败:', error.message);
    res.status(500).json({ success: false, error: '查询失败' });
  }
});

/**
 * GET /api/payment/config
 * 获取支付配置
 */
router.get('/config', (req, res) => {
  res.json({
    success: true,
    data: {
      appId: config.wechatpay.appId,
      price: config.vip.price,
      description: config.vip.description,
      configured: !!(config.wechatpay.mchId && config.wechatpay.appId && config.wechatpay.privateKey)
    }
  });
});

module.exports = router;