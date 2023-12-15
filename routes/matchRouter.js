const express = require('express');
const router = express.Router();

const validator = require('../middleware/joi.validator');

const { isAuthenticate } = require('../middleware/auth');
const { createMatch, updateMatch } = require('../controllers/matchController');
const {  updateMatchValidate, addMatchValidate } = require('../validators/matchValidator');




router.post('/add',isAuthenticate,validator(addMatchValidate),createMatch);
router.post('/update',isAuthenticate,validator(updateMatchValidate),updateMatch);

module.exports = router;
