const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const cookieParser = require('cookie-parser');
const path = require('path');

// 加载环境变量
console.log('正在加载环境变量...');
dotenv.config();

// 调试环境变量
console.log('环境变量加载结果:');
console.log('MONGO_URI是否存在:', process.env.MONGO_URI ? '是' : '否');
console.log('CLIENT_URL是否存在:', process.env.CLIENT_URL ? '是' : '否');
console.log('ZHIPU_API_KEY是否存在:', process.env.ZHIPU_API_KEY ? '是' : '否');

// 导入路由
const auth = require('./routes/api/auth');
const chat = require('./routes/api/chat');
const translate = require('./routes/api/translate');
const classesRoutes = require('./routes/api/classes');
const assignmentsRoutes = require('./routes/api/assignments');
const submissionsRoutes = require('./routes/api/submissions');
const evalRoutes = require('./routes/api/eval');
const libraryRoutes = require('./routes/api/library');
const uploadRoutes = require('./routes/api/upload');

const app = express();

// 中间件
// 配置CORS
const corsOptions = {
  origin: [
    process.env.CLIENT_URL || 'http://localhost:5173',
    'https://gaogirl.github.io'
  ],
  credentials: true, // 允许发送cookies
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(cookieParser());

// 数据库配置
const db = process.env.MONGO_URI;
console.log('数据库连接URI:', db);

// 连接到 MongoDB
mongoose
    .connect(db)
    .then(() => console.log('MongoDB 已成功连接'))
    .catch(err => console.log(err));

// 静态资源（音频上传）
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// 使用路由
app.use('/api/auth', auth);
app.use('/api/chat', chat);
app.use('/api/translate', translate);
app.use('/api/classes', classesRoutes);
app.use('/api/assignments', assignmentsRoutes);
app.use('/api/submissions', submissionsRoutes);
app.use('/api/eval', evalRoutes);
app.use('/api/library', libraryRoutes);
app.use('/api/upload', uploadRoutes);

// 基础路由
app.get('/', (req, res) => {
    res.send('AI 实时翻译 API 正在运行...');
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`服务器正在端口 ${PORT} 上运行`);
});



