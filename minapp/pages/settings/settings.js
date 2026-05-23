const app = getApp();

Page({
  data: {
    apiUrl: '',
    localIP: '192.168.1.54'
  },
  onLoad() {
    const savedUrl = wx.getStorageSync('apiUrl');
    if (savedUrl) {
      this.setData({ apiUrl: savedUrl });
    } else {
      this.setData({ apiUrl: 'http://localhost:3000' });
    }
    this.getLocalIP();
  },
  getLocalIP() {
    const that = this;
    wx.getNetworkType({
      success: function(res) {
        if (res.networkType === 'wifi') {
          wx.onLocalServiceDiscoveryResult(function(res) {
            // 标准获取IP方式
          });
        }
      }
    });
    // 备用：使用之前设置的本机IP
    try {
      const savedIP = wx.getStorageSync('localIP');
      if (savedIP) {
        that.setData({ localIP: savedIP });
      }
    } catch(e) {}
  },
  onApiUrlInput(e) {
    this.setData({ apiUrl: e.detail.value });
    wx.setStorageSync('apiUrl', e.detail.value);
  },
  copyIP() {
    const ip = this.data.localIP;
    const fullUrl = `http://${ip}:3000`;
    wx.setClipboardData({
      data: fullUrl,
      success: () => {
        wx.showToast({ title: '已复制完整地址', icon: 'success' });
      }
    });
  },

  // 跳转到隐私政策
  goPrivacy() {
    wx.navigateTo({
      url: '/pages/privacy/privacy'
    });
  },

  // 跳转到用户协议
  goAgreement() {
    wx.navigateTo({
      url: '/pages/agreement/agreement'
    });
  }
});