const app = getApp();

Page({
  data: {
    apiUrl: '',
    userMessage: '',
    recipientType: '家长',
    gender: '男',
    loading: false,
    showResult: false,
    showPersonPicker: false,
    currentPersonId: '',
    currentPerson: null,
    persons: [],
    imagePath: '',
    recognizedText: '',
    showHelpTipModal: false,
    result: {
      qingzhiType: '',
      qingzhiDesc: '',
      qingzhiTips: [],
      mbtiType: '',
      mbtiDesc: '',
      psychologyHint: '',
      attachmentType: '',
      attachmentDesc: '',
      satirStance: '',
      satirDesc: '',
      bigFiveHint: '',
      learningStyleHint: '',
      eqLevel: '',
      eqDesc: '',
      cognitiveBias: '',
      sdtNeed: '',
      replyOptions: [],
      guide: null,
      warning: null,
      isVip: false,
      warningZone: '',
      emotionTriggers: '',
      relationshipStage: '',
      psychologyEffects: ''
    }
  },
  onLoad() {
    const apiUrl = wx.getStorageSync('apiUrl') || '';
    this.setData({ apiUrl });
    this.loadPersons();
  },
  onShow() {
    this.loadPersons();
  },
  loadPersons() {
    // 从本地存储加载人员列表（后续改为云数据库）
    try {
      const persons = wx.getStorageSync('persons') || [];
      this.setData({ persons });
    } catch(e) {}
  },
  onMessageInput(e) {
    this.setData({ userMessage: e.detail.value });
  },
  onRecipientChange(e) {
    this.setData({ recipientType: e.currentTarget.dataset.type, showResult: false });
  },
  onGenderChange(e) {
    this.setData({ gender: e.currentTarget.dataset.gender, showResult: false });
  },
  clearText() {
    this.setData({ userMessage: '', showResult: false, imagePath: '', recognizedText: '' });
  },

  useQuickPhrase(e) {
    const phraseList = e.currentTarget.dataset.phrases;
    let phrases = [];
    try {
      phrases = JSON.parse(phraseList);
    } catch(err) {
      phrases = [phraseList];
    }
    const phrase = phrases[Math.floor(Math.random() * phrases.length)];
    this.setData({
      userMessage: phrase,
      showResult: false
    });
  },
  chooseImage() {
    wx.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const tempFilePath = res.tempFilePaths[0];
        this.setData({ imagePath: tempFilePath, recognizedText: '', showResult: false });
        this.uploadAndRecognize(tempFilePath);
      }
    });
  },
  uploadAndRecognize(filePath) {
    this.setData({ loading: true });
    const apiUrl = this.data.apiUrl || wx.getStorageSync('apiUrl') || '';
    wx.uploadFile({
      url: apiUrl + '/api/recognize',
      filePath: filePath,
      name: 'image',
      success: (res) => {
        if (res.data) {
          const data = JSON.parse(res.data);
          if (data.success && data.text) {
            this.setData({ recognizedText: data.text, userMessage: data.text });
          } else {
            wx.showToast({ title: data.error || '识别失败', icon: 'none' });
          }
        }
      },
      fail: () => {
        wx.showToast({ title: '上传失败', icon: 'none' });
      },
      complete: () => {
        this.setData({ loading: false });
      }
    });
  },
  previewImage() {
    wx.previewImage({
      urls: [this.data.imagePath]
    });
  },
  removeImage() {
    this.setData({ imagePath: '', recognizedText: '' });
  },
  switchPerson() {
    this.setData({ showPersonPicker: true });
  },
  closePersonPicker() {
    this.setData({ showPersonPicker: false });
  },
  showPersonPicker() {
    this.setData({ showPersonPicker: true });
  },
  onPersonSelect(e) {
    const person = e.currentTarget.dataset.person;
    this.setData({
      currentPersonId: person._id || person.id,
      currentPerson: person,
      showPersonPicker: false
    });
  },
  onCreatePerson() {
    wx.showModal({
      title: '新建分析对象',
      editable: true,
      placeholderText: '请输入姓名（如：小明妈妈）',
      success: (res) => {
        if (res.content && res.confirm) {
          const name = res.content.trim();
          if (!name) {
            wx.showToast({ title: '请输入姓名', icon: 'none' });
            return;
          }
          const newPerson = {
            id: 'temp_' + Date.now(),
            name: name,
            gender: this.data.gender,
            recipientType: this.data.recipientType,
            currentType: '待分析',
            confidence: 0,
            isStable: false,
            analysisCount: 0,
            createdAt: new Date().toISOString()
          };
          const persons = this.data.persons || [];
          persons.unshift(newPerson);
          this.setData({
            persons,
            currentPersonId: newPerson.id,
            currentPerson: newPerson,
            showPersonPicker: false
          });
          wx.setStorageSync('persons', persons);
          wx.showToast({ title: '已创建', icon: 'success' });
        }
      }
    });
  },
  onRandomAnalyze() {
    this.setData({
      showPersonPicker: false,
      currentPersonId: '',
      currentPerson: null
    });
    wx.showToast({ title: '随机分析模式', icon: 'none' });
  },
  handleAnalyze() {
    if (!this.data.userMessage) {
      wx.showToast({ title: '请输入对方的话术', icon: 'none' });
      return;
    }
    const apiUrl = this.data.apiUrl || wx.getStorageSync('apiUrl') || '';
    if (!apiUrl || apiUrl.includes('localhost')) {
      wx.showToast({ title: '请先去设置页配置API地址', icon: 'none' });
      return;
    }
    this.setData({ loading: true, showResult: false });
    const openid = wx.getStorageSync('openid') || '';
    wx.request({
      url: apiUrl + '/api/analyze',
      method: 'POST',
      header: { 'Content-Type': 'application/json' },
      data: {
        userMessage: this.data.userMessage,
        userText: this.data.userText || '',
        recipientType: this.data.recipientType,
        gender: this.data.gender,
        personId: this.data.currentPersonId || '',
        personName: this.data.currentPerson ? this.data.currentPerson.name : '',
        openid
      },
      success: (res) => {
        if (res.data.success) {
          this.setData({ result: res.data.data, showResult: true });
          this.saveAnalysis(res.data.data);
        } else if (res.data.code === 'LIMIT_EXCEEDED') {
          wx.showModal({
            title: '今日次数已用完',
            content: '免费用户每天可分析5次。开通会员可解锁无限次分析！',
            confirmText: '去开通',
            cancelText: '稍后',
            success: (modalRes) => {
              if (modalRes.confirm) {
                wx.switchTab({ url: '/pages/vip/vip' });
              }
            }
          });
        } else {
          wx.showToast({ title: res.data.error || '分析失败', icon: 'none' });
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
  saveAnalysis(data) {
    try {
      // 保存到当前人的分析历史
      if (this.data.currentPersonId) {
        const persons = this.data.persons || [];
        const personIndex = persons.findIndex(p => p.id === this.data.currentPersonId);
        if (personIndex >= 0) {
          persons[personIndex].analysisCount = (persons[personIndex].analysisCount || 0) + 1;
          persons[personIndex].currentType = data.qingzhiType || persons[personIndex].currentType;
          persons[personIndex].confidence = data.confidence || persons[personIndex].confidence;
          persons[personIndex].isStable = data.isStable || false;
          persons[personIndex].lastAnalysis = {
            qingzhiType: data.qingzhiType,
            mbtiType: data.mbtiType,
            satirStance: data.satirStance,
            createdAt: new Date().toISOString()
          };
          this.setData({ persons, currentPerson: persons[personIndex] });
          wx.setStorageSync('persons', persons);
        }
      }
      // 保存分析记录
      let history = wx.getStorageSync('chatHistory') || [];
      history.unshift({
        ...data,
        personId: this.data.currentPersonId,
        personName: this.data.currentPerson ? this.data.currentPerson.name : '',
        timestamp: Date.now(),
        recipientType: this.data.recipientType
      });
      if (history.length > 100) history = history.slice(0, 100);
      wx.setStorageSync('chatHistory', history);
    } catch (e) {}
  },
  copyText(e) {
    const text = e.currentTarget.dataset.text;
    wx.setClipboardData({
      data: text,
      success: () => {
        wx.showToast({ title: '已复制', icon: 'success' });
      }
    });
  },
  goToGuide() {
    wx.navigateTo({ url: '/pages/guide/guide' });
  },

  goToVip() {
    wx.switchTab({ url: '/pages/vip/vip' });
  },

  showHelpTip() {
    this.setData({ showHelpTipModal: true });
  },

  hideHelpTip() {
    this.setData({ showHelpTipModal: false });
  }
});