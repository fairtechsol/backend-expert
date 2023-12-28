const express = require('express');
const { listMatchSuperAdmin } = require('../controllers/superAdminController');
const {matchDetails}= require('../controllers/matchController');
const { getSessions } = require('../controllers/sessionController');
const router = express.Router();

router.get('/match/list',listMatchSuperAdmin);
router.get('/match/:id',matchDetails);
router.get('/session/:matchId',getSessions);

module.exports = router;
