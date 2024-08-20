const express = require('express');
const router = express.Router();

const validator = require('../middleware/joi.validator');

const { isAuthenticate } = require('../middleware/auth');
const { getMatchBetting, matchBettingStatusChange, raceBettingStatusChange, matchBettingApiChange, raceBettingApiChange } = require('../controllers/matchBettingController');
const { matchBetStatusChangeValidator, raceBetStatusChangeValidator, matchBetApiChangeValidator, racingBetApiChangeValidator } = require('../validators/matchBettingValidator');



router.get('/:matchId',isAuthenticate,getMatchBetting);
router.post('/status/change', isAuthenticate, validator(matchBetStatusChangeValidator), matchBettingStatusChange);
router.post('/race/status/change', isAuthenticate, validator(raceBetStatusChangeValidator), raceBettingStatusChange);
router.post('/api/change', isAuthenticate, validator(matchBetApiChangeValidator), matchBettingApiChange);
router.post('/race/api/change', isAuthenticate, validator(racingBetApiChangeValidator), raceBettingApiChange);

module.exports = router;
