const express = require('express');
const router = express.Router();
const { protect } = require('../../middleware/auth');
const evalCtrl = require('../../controllers/eval');

// 翻译质量评估（登录用户均可）
router.post('/translation', protect, evalCtrl.evaluateTranslation);

module.exports = router;
