const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../../middleware/auth');
const classes = require('../../controllers/classes');

// 教师创建班级
router.post('/', protect, authorize('teacher'), classes.createClass);
// 教师更新班级
router.patch('/:id', protect, authorize('teacher'), classes.updateClass);

// 教师重置邀请码
router.post('/:id/reset-invite', protect, authorize('teacher'), classes.resetInvite);

// 学生/教师通过邀请码加入班级（主要面向学生）
router.post('/join', protect, classes.joinByCode);

// 学生：我的班级
router.get('/mine', protect, authorize('student'), classes.myClasses);

// 教师：我教的班级
router.get('/teaching', protect, authorize('teacher'), classes.teachingClasses);

// 教师：成员列表
router.get('/:id/members', protect, authorize('teacher'), classes.classMembers);
// 教师：移除成员
router.delete('/:id/members/:uid', protect, authorize('teacher'), classes.removeMember);

// 班级详情（班级成员或教师可见）
router.get('/:id', protect, classes.classDetail);

// 教师：数据看板
router.get('/:id/dashboard', protect, authorize('teacher'), classes.dashboard);

module.exports = router;

