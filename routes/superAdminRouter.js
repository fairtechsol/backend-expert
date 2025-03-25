const express = require('express');
const { listMatchSuperAdmin, listRacingMatchSuperAdmin, racingCountryCodeListSuperAdmin } = require('../controllers/superAdminController');
const { raceDetails,matchDetails, cardDetails } = require('../controllers/matchController');
const { getSessions } = require('../controllers/sessionController');
const { getTournamentBettingDetails} = require('../controllers/matchBettingController');
const { updateDeleteReason } = require('../validators/betsValidator');
const { sendUpdateDeleteReason } = require('../controllers/betController');
const validator = require('../middleware/joi.validator');
const { getBlinkingTabsData } = require('../controllers/blinkingTabsController');
const router = express.Router();

router.get('/match/list', listMatchSuperAdmin);

// match racing
router.get('/match/racing/countryCode', racingCountryCodeListSuperAdmin);
router.get('/match/racing/list', listRacingMatchSuperAdmin);
router.get('/match/racing/:id', raceDetails);

router.get('/match/:id', matchDetails);
router.get('/match/card/:type', cardDetails);
router.get('/session/:matchId', getSessions);
//api for get match and match betting details for all super admin backend
router.get('/tournamentBetting/:matchId', getTournamentBettingDetails);
router.post("/update/deleteReason", validator(updateDeleteReason), sendUpdateDeleteReason);
router.get("/blinkingTabs", getBlinkingTabsData);

module.exports = router;
