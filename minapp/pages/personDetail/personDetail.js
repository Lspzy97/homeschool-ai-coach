const app = getApp();

Page({
  data: {
    personId: '',
    person: null,
    analyses: []
  },
  onLoad(options) {
    const id = options.id;
    if (id) {
      this.setData({ personId: id });
      this.loadPersonDetail(id);
    }
  },
  loadPersonDetail(personId) {
    try {
      const persons = wx.getStorageSync('persons') || [];
      const person = persons.find(p => p.id === personId);
      if (person) {
        this.setData({ person });
        // 加载该人员的分析历史
        const allHistory = wx.getStorageSync('chatHistory') || [];
        const analyses = allHistory
          .filter(h => h.personId === personId)
          .map(h => ({
            ...h,
            createdAt: h.timestamp ? new Date(h.timestamp).toISOString() : h.createdAt
          }));
        this.setData({ analyses });
      } else {
        wx.showToast({ title: '未找到该人员', icon: 'none' });
        wx.navigateBack();
      }
    } catch(e) {
      wx.showToast({ title: '加载失败', icon: 'none' });
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
  goToAnalyze() {
    const person = this.data.person;
    if (person) {
      wx.setStorageSync('currentPerson', person);
      wx.switchTab({
        url: '/pages/index/index'
      });
    }
  }
});