const express = require('express');
const router = express.Router();

const validator = require('../middleware/joi.validator');

const { isAuthenticate } = require('../middleware/auth');
const { getMatchBetting, matchBettingStatusChange, raceBettingStatusChange, matchBettingRateApiProviderChange, raceBettingRateApiProviderChange, addAndUpdateMatchBetting, getTournamentBettingDetails, cloneMatchBetting } = require('../controllers/matchBettingController');
const { matchBetStatusChangeValidator, raceBetStatusChangeValidator, matchBetApiChangeValidator, racingBetApiChangeValidator, addMatchBettingDataValidator, cloneMatchBettingDataValidator } = require('../validators/matchBettingValidator');



router.get('/:matchId',isAuthenticate,getMatchBetting);
router.get('/tournament/:matchId', isAuthenticate, getTournamentBettingDetails);
router.post('/status/change', isAuthenticate, validator(matchBetStatusChangeValidator), matchBettingStatusChange);
router.post('/race/status/change', isAuthenticate, validator(raceBetStatusChangeValidator), raceBettingStatusChange);
router.post('/change/api/provider', isAuthenticate, validator(matchBetApiChangeValidator), matchBettingRateApiProviderChange);
router.post('/race/change/api/provider', isAuthenticate, validator(racingBetApiChangeValidator), raceBettingRateApiProviderChange);
router.post('/add', isAuthenticate, validator(addMatchBettingDataValidator), addAndUpdateMatchBetting);
router.post('/clone', isAuthenticate, validator(cloneMatchBettingDataValidator), cloneMatchBetting);

module.exports = router;
