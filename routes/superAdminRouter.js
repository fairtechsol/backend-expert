const express = require('express');
const { listMatchSuperAdmin, listRacingMatchSuperAdmin, racingCountryCodeListSuperAdmin } = require('../controllers/superAdminController');
const { raceDetails,matchDetails,matchDetailsForFootball, cardDetails } = require('../controllers/matchController');
const { getSessions } = require('../controllers/sessionController');
const { getMatchBettingDetails, getRaceBettingDetails} = require('../controllers/matchBettingController');
const router = express.Router();

router.get('/match/list', listMatchSuperAdmin);

// match racing
router.get('/match/racing/countryCode', racingCountryCodeListSuperAdmin);
router.get('/match/racing/list', listRacingMatchSuperAdmin);
router.get('/match/racing/:id', raceDetails);

router.get('/match/:id', matchDetails);
router.get('/match/card/:type', cardDetails);
router.get('/otherMatch/:id', matchDetailsForFootball);
router.get('/session/:matchId', getSessions);
//api for get match and match betting details for all super admin backend
router.get('/matchBetting/:matchId', getMatchBettingDetails);
router.get('/raceBetting/:matchId', getRaceBettingDetails);

module.exports = router;
