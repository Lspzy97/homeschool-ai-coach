# 家校AI沟通教练 - 后端服务

## 快速开始

### 1. 安装依赖
```bash
cd server
npm install
```

### 2. 配置API Key
在环境变量中设置通义千问API Key：
```bash
# Windows
set DASHSCOPE_API_KEY=你的API_KEY

# Linux/Mac
export DASHSCOPE_API_KEY=你的API_KEY
```

或直接编辑 `app.js` 中的默认值（不推荐用于生产环境）。

### 3. 启动服务
```bash
# 开发模式
npm run dev

# 生产模式
npm start
```

服务启动后运行在 `http://localhost:3000`

## API接口

### POST /api/analyze

分析聊天记录，返回属性判断和优化文案。

**请求体：**
```json
{
  "userMessage": "对方发送的聊天记录",
  "userText": "用户原本想发送的消息"
}
```

**响应：**
```json
{
  "success": true,
  "data": {
    "qingzhiType": "攻情女",
    "qingzhiDesc": "主动提供情绪价值，边界感强...",
    "mbtiType": "ENFJ",
    "mbtiDesc": "热情、有感染力、善于激励他人...",
    "communicationStrategy": ["策略1", "策略2", "策略3"],
    "optimizedText": "优化后的完整沟通文案",
    "warning": null
  }
}
```

## 获取通义千问API Key

1. 访问阿里云百炼平台：https://bailian.console.aliyun.com/
2. 注册/登录阿里云账号
3. 开通通义千问服务
4. 创建API Key
5. 将Key设置为环境变量 `DASHSCOPE_API_KEY`

## 部署

推荐部署到阿里云函数计算（按调用量计费，适合小规模使用）：
1. 打包项目：`zip -r server.zip server/`
2. 上传至函数计算控制台
3. 配置环境变量 `DASHSCOPE_API_KEY`
4. 设置函数触发器为API网关