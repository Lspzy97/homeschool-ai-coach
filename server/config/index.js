module.exports = {
  wechatpay: {
    // 商户号配置（方案A：有商户号）
    mchId: process.env.WECHAT_MCH_ID || '',
    // 证书序列号
    serialNo: process.env.WECHAT_SERIAL_NO || '',
    // 商户私钥文件路径
    privateKey: process.env.WECHAT_PRIVATE_KEY || '',
    // 商户API密钥（API v2密钥）
    apiKey: process.env.WECHAT_API_KEY || '',
    // 微信应用ID
    appId: process.env.WECHAT_APPID || '',
    // 支付回调地址
    notifyUrl: process.env.WECHAT_NOTIFY_URL || '',
    env: process.env.NODE_ENV || 'development'
  },
  vip: {
    price: 9.9,
    name: '月卡会员',
    description: '家校通AI助手月卡会员'
  }
};