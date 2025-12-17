const express = require('express');
const router = express.Router();
const translateController = require('../../controllers/translate');

// @route   POST api/translate
// @desc    Translate text using ZhipuAI
// @access  Public
router.post('/', translateController.handleTranslate);

module.exports = router;


