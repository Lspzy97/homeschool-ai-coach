const express = require('express');
const cors = require('cors');
const analyzeRoute = require('./routes/analyze');
const recognizeRoute = require('./routes/recognize');
const memberRoute = require('./routes/member');
const paymentRoute = require('./routes/payment');
const userRoute = require('./routes/user');

const app = express();
const PORT = process.env.PORT || 3000;

// 中间件
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// 路由
app.use('/api', analyzeRoute);
app.use('/api', recognizeRoute);
app.use('/api/member', memberRoute);
app.use('/api/payment', paymentRoute);
app.use('/api/user', userRoute);

// 根路由
app.get('/', (req, res) => {
  res.json({ message: '家校AI沟通教练 API', version: '2.0.0' });
});

// 管理后台页面
app.get('/admin', (req, res) => {
  res.sendFile(__dirname + '/admin.html');
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`服务器运行在 http://localhost:${PORT}`);
});