const app = getApp();

Page({
  data: {
    isVip: false,
    vipLevel: '',
    expireDate: '',
    memberSince: '',
    freeAnalysisCount: 0,
    dailyLimit: 5,
    showUpgrade: false,
    paymentReady: false,
    loading: false,
    needLogin: false,
    userOpenid: '',
    userOpenidShort: '',
    selectedPlan: 'yearly',
    vipPrice: '66'
  },

  onLoad() {
    this.checkLoginStatus();
  },

  onShow() {
    this.checkLoginStatus();
  },

  checkLoginStatus() {
    const token = wx.getStorageSync('token');
    const openid = wx.getStorageSync('openid') || '';
    const apiUrl = wx.getStorageSync('apiUrl') || '';

    // 显示用户的openid（截断显示保证隐私）
    if (openid) {
      this.setData({
        userOpenid: openid,
        userOpenidShort: openid.substring(0, 8) + '...' + openid.substring(openid.length - 6)
      });
    }

    if (!token) {
      this.setData({ needLogin: true, showUpgrade: true });
      return;
    }

    if (!openid || !apiUrl) {
      this.setData({ showUpgrade: true });
      return;
    }

    this.setData({ needLogin: false });
    this.checkMemberStatus();
    this.checkPaymentConfig();
  },

  goLogin() {
    wx.navigateTo({ url: '/pages/login/login' });
  },

  checkMemberStatus() {
    const openid = wx.getStorageSync('openid') || '';
    const apiUrl = wx.getStorageSync('apiUrl') || '';

    wx.request({
      url: apiUrl + '/api/member/check',
      data: { openid },
      success: (res) => {
        if (res.data.success && res.data.data) {
          const data = res.data.data;
          // 格式化过期时间显示
          let displayExpireDate = data.expireDate;
          if (data.vipLevel === 'permanent') {
            displayExpireDate = '永久有效';
          } else if (data.expireDate) {
            // 格式化日期
            const date = new Date(data.expireDate);
            displayExpireDate = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
          }
          this.setData({
            isVip: data.isVip,
            vipLevel: data.vipLevel || '',
            expireDate: displayExpireDate || '',
            memberSince: data.memberSince || ''
          });
        }
      },
      fail: () => {
        console.log('会员状态查询失败');
      }
    });
  },

  // 选择会员方案
  selectPlan(e) {
    const plan = e.currentTarget.dataset.plan;
    const prices = { monthly: '9.9', yearly: '66', permanent: '199' };
    this.setData({
      selectedPlan: plan,
      vipPrice: prices[plan]
    });
  },

  // 获取当前选择的方案价格
  getSelectedPrice() {
    const prices = { monthly: '9.9', yearly: '66', permanent: '199' };
    return prices[this.data.selectedPlan] || '66';
  },

  // 获取当前选择的方案名称
  getSelectedPlanName() {
    const names = { monthly: '月卡会员', yearly: '年卡会员', permanent: '永久会员' };
    return names[this.data.selectedPlan] || '年卡会员';
  },

  checkPaymentConfig() {
    const apiUrl = wx.getStorageSync('apiUrl') || '';
    if (!apiUrl) return;

    wx.request({
      url: apiUrl + '/api/payment/config',
      success: (res) => {
        if (res.data.success) {
          this.setData({ paymentReady: res.data.data.configured });
        }
      }
    });
  },

  onWechatPay() {
    const openid = wx.getStorageSync('openid');
    const apiUrl = wx.getStorageSync('apiUrl');
    const token = wx.getStorageSync('token');

    if (!token) {
      wx.showToast({ title: '请先登录', icon: 'none' });
      wx.navigateTo({ url: '/pages/login/login' });
      return;
    }

    if (!openid || !apiUrl) {
      wx.showToast({ title: '请先登录', icon: 'none' });
      return;
    }

    this.setData({ loading: true });

    wx.request({
      url: apiUrl + '/api/payment/jsapi',
      method: 'POST',
      header: {
        'Content-Type': 'application/json',
        'Authorization': token
      },
      data: { openid, vipLevel: this.data.selectedPlan },
      success: (res) => {
        if (res.data.success && res.data.data) {
          const { prepayId, tradeNo } = res.data.data;

          wx.requestPayment({
            timeStamp: Date.now().toString(),
            nonceStr: 'a' + Math.random().toString(36).substr(2, 15),
            package: 'prepay_id=' + prepayId,
            signType: 'RSA',
            paySign: '',
            success: () => {
              wx.showToast({ title: '支付成功', icon: 'success' });
              this.checkMemberStatus();
            },
            fail: (err) => {
              if (err.errMsg === 'requestPayment:fail cancel') {
                wx.showToast({ title: '已取消支付', icon: 'none' });
              } else {
                wx.showToast({ title: '支付失败', icon: 'none' });
              }
            }
          });
        } else {
          wx.showToast({ title: res.data.error || '发起支付失败', icon: 'none' });
        }
      },
      fail: () => {
        wx.showToast({ title: '网络错误', icon: 'none' });
      },
      complete: () => {
        this.setData({ loading: false });
      }
    });
  },

  onContactAuthor() {
    wx.setClipboardData({
      data: 'mss871386855',
      success: () => {
        wx.showToast({
          title: '微信号已复制，粘贴添加',
          icon: 'success',
          duration: 2000
        });
      }
    });
  },

  copyWechat() {
    wx.setClipboardData({
      data: 'mss871386855',
      success: () => {
        wx.showToast({
          title: '微信号已复制',
          icon: 'success',
          duration: 2000
        });
      }
    });
  },

  copyOpenid() {
    const openid = wx.getStorageSync('openid') || '';
    if (!openid) {
      wx.showToast({ title: '未获取到ID', icon: 'none' });
      return;
    }
    wx.setClipboardData({
      data: openid,
      success: () => {
        wx.showToast({
          title: 'ID已复制',
          icon: 'success',
          duration: 2000
        });
      }
    });
  },

  onShareAppMessage() {
    return {
      title: '家校AI沟通教练 - 会员开通',
      path: '/pages/vip/vip'
    };
  }
});