const express = require('express');
const router = express.Router();
const chatController = require('../../controllers/chat');
const { protect } = require('../../middleware/auth');

// @route   POST api/chat
// @desc    Handle chat requests
// @access  Private
router.post('/', protect, chatController.handleChat);

module.exports = router;


