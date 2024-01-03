const express = require('express');
const { listMatchSuperAdmin } = require('../controllers/superAdminController');
const {matchDetails}= require('../controllers/matchController');
const { getSessions } = require('../controllers/sessionController');
const { getMatchBettingDetails } = require('../controllers/matchBettingController');
const router = express.Router();

router.get('/match/list',listMatchSuperAdmin);
router.get('/match/:id',matchDetails);
router.get('/session/:matchId',getSessions);
//api for get match and match betting details for all super admin backend
router.get('/matchBetting/:matchId',getMatchBettingDetails);

module.exports = router;
