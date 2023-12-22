const express = require('express');
const router = express.Router();

const validator = require('../middleware/joi.validator');

const { isAuthenticate } = require('../middleware/auth');
const { getMatchBetting } = require('../controllers/matchBettingController');



router.get('/:matchId',isAuthenticate,getMatchBetting);

module.exports = router;
