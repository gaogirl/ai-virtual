const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../../middleware/auth');
const lib = require('../../controllers/library');

// Terms
router.get('/terms', protect, lib.listTerms);
router.post('/terms', protect, authorize('teacher'), lib.createTerm);
router.patch('/terms/:id', protect, authorize('teacher'), lib.updateTerm);
router.delete('/terms/:id', protect, authorize('teacher'), lib.removeTerm);

// Cases
router.get('/cases', protect, lib.listCases);
router.get('/cases/:id', protect, lib.getCase);
router.post('/cases', protect, authorize('teacher'), lib.createCase);
router.patch('/cases/:id', protect, authorize('teacher'), lib.updateCase);
router.delete('/cases/:id', protect, authorize('teacher'), lib.removeCase);

module.exports = router;

