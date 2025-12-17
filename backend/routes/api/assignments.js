const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../../middleware/auth');
const assignments = require('../../controllers/assignments');

// 教师：布置作业
router.post('/', protect, authorize('teacher'), assignments.create);
// 教师：更新作业
router.patch('/:id', protect, authorize('teacher'), assignments.update);
// 教师：删除作业
router.delete('/:id', protect, authorize('teacher'), assignments.remove);

// 班级作业列表（学生/教师都可，接口内部校验是否班级成员）
router.get('/class/:classId', protect, assignments.listForStudent);

// 作业详情（班级成员可见，隐藏参考答案）
router.get('/:id', protect, assignments.detail);

// 学生提交作业（自动初评）
router.post('/:id/submit', protect, authorize('student'), assignments.submit);

// 教师查看提交列表
router.get('/:id/submissions', protect, authorize('teacher'), assignments.submissionsOf);

module.exports = router;

