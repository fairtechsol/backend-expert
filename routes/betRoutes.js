const express = require("express");
const router = express.Router();
const { declareSessionResult, declareSessionNoResult, unDeclareSessionResult, getPlacedBets, declareMatchResult, unDeclareMatchResult, declareOtherMatchResult, unDeclareOtherMatchResult } = require("../controllers/betController");
const { isAuthenticate } = require("../middleware/auth");
const validator = require('../middleware/joi.validator');
const { sessionDeclareValidator, sessionDeclareNoResultValidator, sessionUnDeclareValidator, matchDeclareValidator, matchUnDeclareValidator, otherMatchDeclareValidator, otherMatchUnDeclareValidator } = require("../validators/betsValidator");

router.post("/declare/result/session", isAuthenticate, validator(sessionDeclareValidator), declareSessionResult);
router.post("/declare/noResult/session", isAuthenticate, validator(sessionDeclareNoResultValidator), declareSessionNoResult);
router.post("/unDeclare/result/session", isAuthenticate, validator(sessionUnDeclareValidator), unDeclareSessionResult);
router.post("/declare/result/match", isAuthenticate, validator(matchDeclareValidator), declareMatchResult);
router.post("/declare/result/other/match", isAuthenticate, validator(otherMatchDeclareValidator), declareOtherMatchResult);
router.post("/unDeclare/result/match", isAuthenticate, validator(matchUnDeclareValidator), unDeclareMatchResult);
router.post("/unDeclare/result/other/match", isAuthenticate, validator(otherMatchUnDeclareValidator), unDeclareOtherMatchResult);
router.get("/", isAuthenticate, getPlacedBets);

module.exports = router;
