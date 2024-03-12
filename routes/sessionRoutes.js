const express = require('express');
const router = express.Router();

const validator = require('../middleware/joi.validator');

const { isAuthenticate } = require('../middleware/auth');

const {addsessionBettingValidator,updateSessionBettingValidator, UpdateSessionstatusValidator} = require("../validators/sessionValidator")
const {addSession,updateSession, getSessions, updateMarketSessionActiveStatus, getSessionProfitLoss, getSessionBetResult} = require("../controllers/sessionController")

// @route add session route
router.post('/add',isAuthenticate,validator(addsessionBettingValidator),addSession);

router.post('/update',isAuthenticate,validator(updateSessionBettingValidator),updateSession)

router.get('/:matchId',isAuthenticate,getSessions);
router.post('/status/:id',isAuthenticate,validator(UpdateSessionstatusValidator),updateMarketSessionActiveStatus);
router.get('/profitLoss/:sessionId',isAuthenticate,getSessionProfitLoss);
router.get("/result/:matchId", isAuthenticate, getSessionBetResult);

module.exports = router;