# 家校AI沟通教练 - 小程序

## 项目简介

基于情直理论、MBTI和家庭教育心理学的家校沟通话术优化小程序。

## 功能特性

- **智能分析**：自动判断对方情直属性和MBTI人格
- **话术优化**：AI生成更合适的沟通文案
- **沟通策略**：提供针对性的沟通建议
- **历史记录**：保存最近50条分析记录
- **情绪预警**：提醒需要注意的沟通雷区

## 技术栈

- UniApp + Vue.js
- 跨平台（支持微信、支付宝等小程序）

## 开发指南

### 1. 环境要求

- Node.js 16+
- HBuilderX（UniApp IDE）
- 微信开发者工具（用于微信小程序）

### 2. 获取API Key

1. 访问阿里云百炼平台：https://bailian.console.aliyun.com/
2. 开通通义千问服务
3. 创建API Key

### 3. 启动后端服务

```bash
cd server
npm install
export DASHSCOPE_API_KEY=你的API_KEY  # Windows用set
npm run dev
```

### 4. 配置并启动小程序

1. 用HBuilderX打开 `minapp` 目录
2. 修改 `pages/settings/settings.vue` 中的默认API地址（如果需要）
3. 运行到微信开发者工具

### 5. 微信小程序配置

1. 在微信公众平台注册小程序
2. 获取AppID并填入 `package.json` 的 `mp-weixin.appid`
3. 在微信开发者工具中导入项目
4. 配置服务器域名（后台管理 → 开发管理 → 开发设置）

## 目录结构

```
home-school-ai-coach/
├── minapp/                    # 小程序前端
│   ├── pages/
│   │   ├── index/             # 首页（分析入口）
│   │   ├── history/           # 历史记录
│   │   └── settings/          # 设置页
│   ├── utils/
│   │   └── api.js             # API调用封装
│   ├── pages.json             # 页面配置
│   └── package.json           # 项目配置
│
├── server/                    # 后端服务
│   ├── app.js                 # Express入口
│   ├── routes/analyze.js      # 分析接口
│   ├── services/aiService.js  # AI调用逻辑
│   └── prompts/               # AI提示词
│
└── theory/                    # 理论文档（参考用）
```

## 使用流程

1. 复制家长/老师/学生发送的聊天记录
2. 粘贴到小程序输入框
3. 输入你想发送的内容
4. 点击「开始分析」
5. 查看分析结果和优化话术
6. 点击「复制发送」

## 注意事项

- 后端服务必须启动才能正常使用分析功能
- 首次使用需在「设置」页配置API地址
- 微信小程序需要配置服务器域名才能访问后端API