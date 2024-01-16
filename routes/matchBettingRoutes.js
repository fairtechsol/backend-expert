const express = require('express');
const router = express.Router();

const validator = require('../middleware/joi.validator');

const { isAuthenticate } = require('../middleware/auth');
const { getMatchBetting, matchBettingStatusChange } = require('../controllers/matchBettingController');
const { matchBetStatusChangeValidator } = require('../validators/matchBettingValidator');



router.get('/:matchId',isAuthenticate,getMatchBetting);
router.post('/status/change', isAuthenticate, validator(matchBetStatusChangeValidator), matchBettingStatusChange);

module.exports = router;
