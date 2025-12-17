const express = require('express');
const router = express.Router();
const chatController = require('../../controllers/chat');

// @route   POST api/chat
// @desc    Handle chat requests
// @access  Public
router.post('/', chatController.handleChat);

module.exports = router;



