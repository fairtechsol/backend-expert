const express = require("express");
const router = express.Router();
const { declareSessionResult, declareSessionNoResult, unDeclareSessionResult, getPlacedBets,  declareTournamentMatchResult, unDeclareTournamentMatchResult, verifyBet, declareFinalMatchResult, unDeclareFinalMatchResult } = require("../controllers/betController");
const { isAuthenticate } = require("../middleware/auth");
const validator = require('../middleware/joi.validator');
const { sessionDeclareValidator, sessionDeclareNoResultValidator, sessionUnDeclareValidator, tournamentMatchDeclareValidator, tournamentMatchUnDeclareValidator, verifyBetValidator, finalMatchDeclareValidator, finalMatchUnDeclareValidator } = require("../validators/betsValidator");
const { apiLimiter } = require("../middleware/apiHitLimiter");

router.post("/declare/result/session", apiLimiter, isAuthenticate, validator(sessionDeclareValidator), declareSessionResult);
router.post("/declare/noResult/session", apiLimiter, isAuthenticate, validator(sessionDeclareNoResultValidator), declareSessionNoResult);
router.post("/unDeclare/result/session", apiLimiter, isAuthenticate, validator(sessionUnDeclareValidator), unDeclareSessionResult);

router.post("/declare/result/tournament/match", apiLimiter, isAuthenticate, validator(tournamentMatchDeclareValidator), declareTournamentMatchResult);
router.post("/declare/result/final/match", apiLimiter, isAuthenticate, validator(finalMatchDeclareValidator), declareFinalMatchResult);

router.post("/unDeclare/result/tournament/match", apiLimiter, isAuthenticate, validator(tournamentMatchUnDeclareValidator), unDeclareTournamentMatchResult);
router.post("/unDeclare/result/final/match", apiLimiter, isAuthenticate, validator(finalMatchUnDeclareValidator), unDeclareFinalMatchResult);

router.get("/", isAuthenticate, getPlacedBets);
router.post("/verify", isAuthenticate, validator(verifyBetValidator), verifyBet);

module.exports = router;
