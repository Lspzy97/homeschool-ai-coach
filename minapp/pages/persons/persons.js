const app = getApp();

Page({
  data: {
    persons: [],
    stableCount: 0,
    totalAnalyses: 0
  },
  onLoad() {},
  onShow() {
    this.loadPersons();
  },
  loadPersons() {
    try {
      const persons = wx.getStorageSync('persons') || [];
      const stableCount = persons.filter(p => p.isStable).length;
      const totalAnalyses = persons.reduce((sum, p) => sum + (p.analysisCount || 0), 0);
      this.setData({ persons, stableCount, totalAnalyses });
    } catch(e) {
      this.setData({ persons: [], stableCount: 0, totalAnalyses: 0 });
    }
  },
  formatTime(timeStr) {
    if (!timeStr) return '';
    const date = new Date(timeStr);
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const hour = date.getHours().toString().padStart(2, '0');
    const minute = date.getMinutes().toString().padStart(2, '0');
    return `${month}月${day}日 ${hour}:${minute}`;
  },
  viewPersonDetail(e) {
    const person = e.currentTarget.dataset.person;
    wx.navigateTo({
      url: '/pages/personDetail/personDetail?id=' + person.id
    });
  }
});