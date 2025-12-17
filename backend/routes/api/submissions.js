const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../../middleware/auth');
const submissions = require('../../controllers/submissions');

// 获取提交详情（教师）
router.get('/:id', protect, authorize('teacher'), submissions.getOne);

// 教师批改
router.post('/:id/grade', protect, authorize('teacher'), submissions.grade);

module.exports = router;

