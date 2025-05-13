const express = require('express');
const router = express.Router();

const validator = require('../middleware/joi.validator');

const { isAuthenticate } = require('../middleware/auth');
const {  matchBettingStatusChange, addAndUpdateMatchBetting, getTournamentBettingDetails, cloneMatchBetting } = require('../controllers/matchBettingController');
const { matchBetStatusChangeValidator, addMatchBettingDataValidator, cloneMatchBettingDataValidator } = require('../validators/matchBettingValidator');



router.get('/tournament/:matchId', isAuthenticate, getTournamentBettingDetails);
router.post('/status/change', isAuthenticate, validator(matchBetStatusChangeValidator), matchBettingStatusChange);
router.post('/add', isAuthenticate, validator(addMatchBettingDataValidator), addAndUpdateMatchBetting);
router.post('/clone', isAuthenticate, validator(cloneMatchBettingDataValidator), cloneMatchBetting);

module.exports = router;
