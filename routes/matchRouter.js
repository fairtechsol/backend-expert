const express = require('express');
const router = express.Router();

const validator = require('../middleware/joi.validator');

const { isAuthenticate } = require('../middleware/auth');
const { createMatch } = require('../controllers/matchController');
const { addMatch } = require('../validators/matchValidator');




router.post('/add',isAuthenticate,validator(addMatch),createMatch);

module.exports = router;
