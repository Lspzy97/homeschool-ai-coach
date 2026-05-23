const app = getApp();

Page({
  data: {
    theoryContent: `如何让家校沟通更顺畅？很简单，那就是情直理论，其由心理学博主六日提出并逐步完善。

理论的核心在于，男女在社交策略中都有情、直两种基本类型，并在基本类型上，男性又分为多偶或单偶倾向，女性分为攻或守两种倾向。

由此，男女分别有四种不同的属性类型：
• 单偶直男 · 多偶直男 · 单偶情男 · 多偶情男
• 攻情女 · 守情女 · 攻直女 · 守直女

而稳定的长期社交关系基本是遵循以下原则：
• 情直互配
• 攻对单
• 守对多

情直理论基于脑科学、心理动力学、进化心理学，并结合10余年的心理咨询案例，具备科学基础的同时，简单明了，便于大众理解，长期社交关系的互配，适合所有人，用于经营长期关系和家校沟通。`,

    typeList: [
      { name: '单偶直男', emoji: '🧑‍💼', imgSrc: '/images/types/单偶直男.png', color: '#667EEA', desc: '专一务实、行动实在话不多、关键时刻靠谱、不懂浪漫但可靠、默默做事有责任心' },
      { name: '多偶直男', emoji: '🧑‍💻', imgSrc: '/images/types/多偶直男.png', color: '#764BA2', desc: '目标导向、结果说话、情感浓度低不纠结、效率至上解决问题导向、边界清晰各管各的' },
      { name: '老实情男', emoji: '👨‍🎨', imgSrc: '/images/types/单偶情男.png', color: '#EC4899', desc: '高情商会察言观色、压力下灵活变通、善于捕捉需求让人舒服、嘴上不硬撑行动有弹性' },
      { name: '强势情男', emoji: '👨‍💼', imgSrc: '/images/types/多偶情男.png', color: '#F59E0B', desc: '掌控人心、情绪价值投喂、打一巴掌给甜枣、做事手段多风险意识弱、让你自我怀疑离不开' },
      { name: '攻情女', emoji: '👩‍💼', imgSrc: '/images/types/攻情女.png', color: '#F093FB', desc: '情商高会说话、边界感强知道进退、看人看优点不给人贴标签、主动提供情绪价值' },
      { name: '守情女', emoji: '👩‍🎨', imgSrc: '/images/types/守情女.png', color: '#10B981', desc: '配合度高没主见、配合但有底线、善于倾听、害怕冲突宁可委屈自己' },
      { name: '攻直女', emoji: '👩‍💻', imgSrc: '/images/types/攻直女.png', color: '#6366F1', desc: '主动直接、目标明确不墨迹、执行力强、物质化倾向看重实际利益、见风使舵适应性强' },
      { name: '守直女', emoji: '👩‍🔬', imgSrc: '/images/types/守直女.png', color: '#8B5CF6', desc: '敏感在意别人看法、托付心态把幸福寄托他人、外归因总觉得不公平、情绪来得快去得慢、抱怨但不离开' }
    ]
  },

  onShareAppMessage() {
    return {
      title: '情直理论介绍',
      path: '/pages/guide/guide'
    }
  },

  copyWechat() {
    wx.setClipboardData({
      data: 'liurizhuli',
      success: () => {
        wx.showToast({
          title: '微信号已复制',
          icon: 'success',
          duration: 2000
        });
      }
    });
  },

  previewImage(e) {
    const src = e.currentTarget.dataset.src;
    wx.previewImage({
      current: src,
      urls: [src]
    });
  }
})