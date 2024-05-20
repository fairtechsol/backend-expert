const express = require('express');
const router = express.Router();
const validator = require('../middleware/joi.validator');
const { isAuthenticate } = require('../middleware/auth');
const { racingCreateMatch, createMatch, updateMatch, listMatch, matchDetails, matchActiveInActive, getMatchCompetitionsByType, getMatchDatesByCompetitionId, getMatchDatesByCompetitionIdAndDate, matchListWithManualBetting,matchDetailsForFootball } = require('../controllers/matchController');
const { racingAddMatchValidate, updateMatchValidate, addMatchValidate, MatchActiveInactive } = require('../validators/matchValidator');


router.post('/add', isAuthenticate, validator(addMatchValidate), createMatch);
router.post('/update', isAuthenticate, validator(updateMatchValidate), updateMatch);
router.get('/list', isAuthenticate, listMatch);
router.get('/listWithManualBetting', isAuthenticate, matchListWithManualBetting);
router.get('/competitionList/:type', getMatchCompetitionsByType);
router.get('/competition/dates/:competitionId', getMatchDatesByCompetitionId);
router.get('/competition/getMatch/:competitionId/:date', getMatchDatesByCompetitionIdAndDate);
router.post('/updateActiveStatus', isAuthenticate, validator(MatchActiveInactive), matchActiveInActive);
router.get('/:id', isAuthenticate, matchDetails);
router.get('/otherMatch/:id', isAuthenticate, matchDetailsForFootball);
router.post('/racingAdd', isAuthenticate, validator(racingAddMatchValidate), racingCreateMatch);

module.exports = router;
