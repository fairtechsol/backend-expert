const express = require('express');
const router = express.Router();

const validator = require('../middleware/joi.validator');

const { isAuthenticate } = require('../middleware/auth');
const { createMatch, updateMatch, listMatch, matchDetails, matchActiveInActive, getMatchCompetitionsByType, getMatchDatesByCompetitionId } = require('../controllers/matchController');
const {  updateMatchValidate, addMatchValidate, MatchActiveInactive } = require('../validators/matchValidator');
const { getMatchByCompetitionIdAndDates } = require('../services/matchService');




router.post('/add',isAuthenticate,validator(addMatchValidate),createMatch);
router.post('/update',isAuthenticate,validator(updateMatchValidate),updateMatch);
router.get('/list',isAuthenticate,listMatch);
router.get('/:id',isAuthenticate,matchDetails);
router.get('/competitionList/:type',isAuthenticate,getMatchCompetitionsByType);
router.get('/competition/dates/:competitionId',isAuthenticate,getMatchDatesByCompetitionId);
router.get('/competition/getMatch/:competitionId/:date',isAuthenticate,getMatchByCompetitionIdAndDates);
router.post('/updateActiveStatus',isAuthenticate,validator(MatchActiveInactive),matchActiveInActive);

module.exports = router;
