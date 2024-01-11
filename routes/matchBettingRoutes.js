const express = require('express');
const router = express.Router();

const validator = require('../middleware/joi.validator');

const { isAuthenticate } = require('../middleware/auth');
const { getMatchBetting, matchBettingStatusChange } = require('../controllers/matchBettingController');



router.get('/:matchId',isAuthenticate,getMatchBetting);
router.post('/status/change',isAuthenticate, matchBettingStatusChange);

module.exports = router;
