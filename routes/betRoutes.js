const express = require("express");
const router = express.Router();
const { declareSessionResult, declareSessionNoResult, unDeclareSessionResult, getPlacedBets, declareMatchResult, unDeclareMatchResult } = require("../controllers/betController");
const { isAuthenticate } = require("../middleware/auth");
const validator = require('../middleware/joi.validator');
const { sessionDeclareValidator, sessionDeclareNoResultValidator, sessionUnDeclareValidator, matchDeclareValidator, matchUnDeclareValidator } = require("../validators/betsValidator");

router.post("/declare/result/session", isAuthenticate, validator(sessionDeclareValidator), declareSessionResult);
router.post("/declare/noResult/session", isAuthenticate, validator(sessionDeclareNoResultValidator), declareSessionNoResult);
router.post("/unDeclare/result/session", isAuthenticate, validator(sessionUnDeclareValidator), unDeclareSessionResult);
router.post("/declare/result/match", isAuthenticate, validator(matchDeclareValidator), declareMatchResult);
router.post("/unDeclare/result/match", isAuthenticate, validator(matchUnDeclareValidator), unDeclareMatchResult);
router.get("/", isAuthenticate, getPlacedBets);

module.exports = router;
