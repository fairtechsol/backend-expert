const express = require('express');
const router = express.Router();
const validator = require('../middleware/joi.validator');
const { isAuthenticate } = require('../middleware/auth');

const { racingCreateMatch, createMatch, updateMatch, listMatch, matchDetails, matchActiveInActive, getMatchCompetitionsByType, getMatchDatesByCompetitionId, getMatchDatesByCompetitionIdAndDate, matchListWithManualBetting,matchDetailsForFootball,racingMatchDateList, racingCountryCodeList, listRacingMatch, raceDetails , racingUpdateMatch, cardDetails, multipleMatchActiveInActive} = require('../controllers/matchController');
const {racingUpdateMatchValidate, racingAddMatchValidate, updateMatchValidate, addMatchValidate, MatchActiveInactive, MultipleMatchActiveInactive } = require('../validators/matchValidator');


router.post('/add', isAuthenticate, validator(addMatchValidate), createMatch);
router.post('/update', isAuthenticate, validator(updateMatchValidate), updateMatch);
router.get('/list', isAuthenticate, listMatch);
router.get('/listWithManualBetting', isAuthenticate, matchListWithManualBetting);
router.get('/competitionList/:type', getMatchCompetitionsByType);
router.get('/competition/dates/:competitionId', getMatchDatesByCompetitionId);
router.get('/competition/getMatch/:competitionId/:date', getMatchDatesByCompetitionIdAndDate);
router.post('/updateActiveStatus', isAuthenticate, validator(MatchActiveInactive), matchActiveInActive);
router.post('/updateActiveStatus/multiple', isAuthenticate, validator(MultipleMatchActiveInactive), multipleMatchActiveInActive);

//racing routes
router.get('/dateWiseList', isAuthenticate, racingMatchDateList);
router.get('/countryWiseList', isAuthenticate, racingCountryCodeList);
router.get('/racing/list', isAuthenticate, listRacingMatch);

router.get('/:id', isAuthenticate, matchDetails);
router.get('/otherMatch/:id', isAuthenticate, matchDetailsForFootball);
router.post('/racingAdd', isAuthenticate, validator(racingAddMatchValidate), racingCreateMatch);
router.post('/racingUpdate', isAuthenticate, validator(racingUpdateMatchValidate), racingUpdateMatch);
router.get('/racing/:id', isAuthenticate, raceDetails);
router.get('/card/:type', isAuthenticate, cardDetails);


module.exports = router;
