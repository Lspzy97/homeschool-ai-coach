const app = getApp();

Page({
  data: {
    lastUpdate: '2026年5月23日'
  },

  onLoad() {
    wx.setNavigationBarTitle({
      title: '用户协议'
    });
  },

  // 返回上一页
  goBack() {
    wx.navigateBack();
  }
});