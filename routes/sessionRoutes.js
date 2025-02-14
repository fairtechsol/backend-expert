const express = require('express');
const router = express.Router();

const validator = require('../middleware/joi.validator');

const { isAuthenticate } = require('../middleware/auth');

const { addsessionBettingValidator, updateSessionBettingValidator, UpdateSessionstatusValidator, updateMultiSessionBettingMaxBetValidator } = require("../validators/sessionValidator")
const { addSession, updateSession, getSessions, updateMarketSessionActiveStatus, getSessionProfitLoss, getSessionBetResult, updateSessionMaxBet, sessionProfitLossUserWise, sessionProfitLossBets } = require("../controllers/sessionController")

// @route add session route
router.post('/add', isAuthenticate, validator(addsessionBettingValidator), addSession);

router.post('/update', isAuthenticate, validator(updateSessionBettingValidator), updateSession)

router.get('/:matchId', isAuthenticate, getSessions);
router.post('/status/:id', isAuthenticate, validator(UpdateSessionstatusValidator), updateMarketSessionActiveStatus);
router.get('/profitLoss/userWise', isAuthenticate, sessionProfitLossUserWise)
router.get('/profitLoss/userWiseBets', isAuthenticate, sessionProfitLossBets)
router.get('/profitLoss/:sessionId', isAuthenticate, getSessionProfitLoss);
router.get("/result/:matchId", isAuthenticate, getSessionBetResult);
router.post('/multi/maxBet/update', isAuthenticate, validator(updateMultiSessionBettingMaxBetValidator), updateSessionMaxBet)

module.exports = router;