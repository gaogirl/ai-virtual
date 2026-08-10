const express = require('express');
const router = express.Router();
const translateController = require('../../controllers/translate');
const { protect } = require('../../middleware/auth');

// @route   POST api/translate
// @desc    Translate text using ZhipuAI
// @access  Private
router.post('/', protect, translateController.handleTranslate);

module.exports = router;

