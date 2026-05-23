const app = getApp();

Page({
  data: {
    history: [],
    showDetail: false,
    currentItem: {}
  },
  onShow() {
    this.loadHistory();
  },
  loadHistory() {
    try {
      this.setData({ history: wx.getStorageSync('chatHistory') || [] });
    } catch (e) {
      this.setData({ history: [] });
    }
  },
  formatTime(timestamp) {
    const date = new Date(timestamp);
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const hour = date.getHours().toString().padStart(2, '0');
    const minute = date.getMinutes().toString().padStart(2, '0');
    return `${month}月${day}日 ${hour}:${minute}`;
  },
  viewDetail(e) {
    this.setData({ currentItem: e.currentTarget.dataset.item, showDetail: true });
  },
  closeDetail() {
    this.setData({ showDetail: false });
  },
  copyText(e) {
    const text = e.currentTarget.dataset.text;
    wx.setClipboardData({
      data: text,
      success: () => wx.showToast({ title: '已复制', icon: 'success' })
    });
  }
});