const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../../middleware/auth');
const profile = require('../../controllers/learningProfile');

router.get('/me/learning-profile', protect, authorize('student'), profile.getMine);

module.exports = router;
