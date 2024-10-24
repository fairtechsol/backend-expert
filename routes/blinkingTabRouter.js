const express = require('express');
const router = express.Router();

const validator = require('../middleware/joi.validator');

const { isAuthenticate } = require('../middleware/auth');
const { addBlinkTabsValidator } = require('../validators/blinkTabsValidator');
const { addBlinkingTabsData, getBlinkingTabsData, removeBlinkingTabsData } = require('../controllers/blinkingTabsController');


router.post('/add', isAuthenticate, validator(addBlinkTabsValidator), addBlinkingTabsData);
router.get('/', getBlinkingTabsData);
router.delete('/:id', removeBlinkingTabsData);

module.exports = router;