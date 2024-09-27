const express = require('express');
const router = express.Router();

const validator = require('../middleware/joi.validator');

const { isAuthenticate } = require('../middleware/auth');
const { getMatchBetting, matchBettingStatusChange, raceBettingStatusChange } = require('../controllers/matchBettingController');
const { matchBetStatusChangeValidator, raceBetStatusChangeValidator } = require('../validators/matchBettingValidator');



router.get('/:matchId',isAuthenticate,getMatchBetting);
router.post('/status/change', isAuthenticate, validator(matchBetStatusChangeValidator), matchBettingStatusChange);
router.post('/race/status/change', isAuthenticate, validator(raceBetStatusChangeValidator), raceBettingStatusChange);

module.exports = router;
