const express = require("express");
const router = express.Router();
const { declareSessionResult, declareSessionNoResult, unDeclareSessionResult, getPlacedBets, declareMatchResult, unDeclareMatchResult, declareOtherMatchResult, unDeclareOtherMatchResult, declareRacingMatchResult, unDeclareRacingMatchResult, declareMatchOtherMarketResult, unDeclareMatchOtherMarketResult, declareTournamentMatchResult, unDeclareTournamentMatchResult, verifyBet, declareFinalMatchResult, unDeclareFinalMatchResult } = require("../controllers/betController");
const { isAuthenticate } = require("../middleware/auth");
const validator = require('../middleware/joi.validator');
const { sessionDeclareValidator, sessionDeclareNoResultValidator, sessionUnDeclareValidator, matchDeclareValidator, matchUnDeclareValidator, otherMatchDeclareValidator, otherMatchUnDeclareValidator, raceMatchUnDeclareValidator, raceMatchDeclareValidator, tournamentMatchDeclareValidator, tournamentMatchUnDeclareValidator, verifyBetValidator, finalMatchDeclareValidator, finalMatchUnDeclareValidator } = require("../validators/betsValidator");
const { apiLimiter } = require("../middleware/apiHitLimiter");

router.post("/declare/result/session", apiLimiter, isAuthenticate, validator(sessionDeclareValidator), declareSessionResult);
router.post("/declare/noResult/session", apiLimiter, isAuthenticate, validator(sessionDeclareNoResultValidator), declareSessionNoResult);
router.post("/unDeclare/result/session", apiLimiter, isAuthenticate, validator(sessionUnDeclareValidator), unDeclareSessionResult);

router.post("/declare/result/match", apiLimiter, isAuthenticate, validator(matchDeclareValidator), declareMatchResult);
router.post("/declare/result/other/market", apiLimiter, isAuthenticate, validator(otherMatchDeclareValidator), declareMatchOtherMarketResult);
router.post("/declare/result/other/match", apiLimiter, isAuthenticate, validator(otherMatchDeclareValidator), declareOtherMatchResult);
router.post("/declare/result/race/match", apiLimiter, isAuthenticate, validator(raceMatchDeclareValidator), declareRacingMatchResult);
router.post("/declare/result/tournament/match", apiLimiter, isAuthenticate, validator(tournamentMatchDeclareValidator), declareTournamentMatchResult);
router.post("/declare/result/final/match", apiLimiter, isAuthenticate, validator(finalMatchDeclareValidator), declareFinalMatchResult);

router.post("/unDeclare/result/match", apiLimiter, isAuthenticate, validator(matchUnDeclareValidator), unDeclareMatchResult);
router.post("/unDeclare/result/other/match", apiLimiter, isAuthenticate, validator(otherMatchUnDeclareValidator), unDeclareOtherMatchResult);
router.post("/unDeclare/result/other/market", apiLimiter, isAuthenticate, validator(otherMatchUnDeclareValidator), unDeclareMatchOtherMarketResult);
router.post("/unDeclare/result/race/match", apiLimiter, isAuthenticate, validator(raceMatchUnDeclareValidator), unDeclareRacingMatchResult);
router.post("/unDeclare/result/tournament/match", apiLimiter, isAuthenticate, validator(tournamentMatchUnDeclareValidator), unDeclareTournamentMatchResult);
router.post("/unDeclare/result/final/match", apiLimiter, isAuthenticate, validator(finalMatchUnDeclareValidator), unDeclareFinalMatchResult);

router.get("/", isAuthenticate, getPlacedBets);
router.post("/verify", isAuthenticate, validator(verifyBetValidator), verifyBet);

module.exports = router;
