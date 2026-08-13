const express = require('express');
const router = express.Router();
const { register, login, getMe } = require('../../controllers/auth');
const { protect } = require('../../middleware/auth');

// 公开路由
router.post('/register', register);
router.post('/login', login);

// 受保护的路由
router.get('/me', protect, getMe);

module.exports = router;





