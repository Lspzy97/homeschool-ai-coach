const app = getApp();

Page({
  data: {
    loading: false,
    error: ''
  },

  onLoad() {
    // 检查是否已登录
    this.checkLogin();
  },

  checkLogin() {
    const token = wx.getStorageSync('token');
    if (token) {
      // 已登录，直接跳转
      wx.switchTab({ url: '/pages/index/index' });
    }
  },

  // 微信授权登录
  onWxLogin() {
    this.setData({ loading: true, error: '' });

    wx.login({
      success: (loginRes) => {
        if (!loginRes.code) {
          this.setData({ error: '获取授权码失败', loading: false });
          return;
        }

        const apiUrl = wx.getStorageSync('apiUrl') || '';
        if (!apiUrl) {
          this.setData({ error: '请先在设置页配置API地址', loading: false });
          return;
        }

        wx.request({
          url: apiUrl + '/api/user/wxlogin',
          method: 'POST',
          header: { 'Content-Type': 'application/json' },
          data: { code: loginRes.code },
          success: (res) => {
            if (res.data.success) {
              const { token, openid, isVip, isNew } = res.data.data;

              // 保存登录信息
              wx.setStorageSync('token', token);
              wx.setStorageSync('openid', openid);
              wx.setStorageSync('isVip', isVip);

              if (isNew) {
                wx.showToast({ title: '欢迎使用', icon: 'success' });
              } else {
                wx.showToast({ title: '登录成功', icon: 'success' });
              }

              // 跳转到首页
              setTimeout(() => {
                wx.switchTab({ url: '/pages/index/index' });
              }, 1000);
            } else {
              this.setData({ error: res.data.error || '登录失败' });
            }
          },
          fail: () => {
            this.setData({ error: '网络错误，请检查服务器连接' });
          },
          complete: () => {
            this.setData({ loading: false });
          }
        });
      },
      fail: () => {
        this.setData({ error: '微信授权失败', loading: false });
      }
    });
  },

  // 跳过登录（临时使用）
  onSkip() {
    wx.navigateTo({
      url: '/pages/settings/settings',
      fail: () => {
        wx.switchTab({ url: '/pages/settings/settings' });
      }
    });
  },

  // 跳转到用户协议
  goAgreement() {
    wx.navigateTo({ url: '/pages/agreement/agreement' });
  },

  // 跳转到隐私政策
  goPrivacy() {
    wx.navigateTo({ url: '/pages/privacy/privacy' });
  }
});