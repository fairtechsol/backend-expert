const express = require("express");
const router = express.Router();
const { declareSessionResult, declareSessionNoResult, unDeclareSessionResult, getPlacedBets } = require("../controllers/betController");
const { isAuthenticate } = require("../middleware/auth");
const validator = require('../middleware/joi.validator');
const { sessionDeclareValidator, sessionDeclareNoResultValidator, sessionUnDeclareValidator } = require("../validators/betsValidator");

router.post("/declare/result/session", isAuthenticate, validator(sessionDeclareValidator), declareSessionResult);
router.post("/declare/noResult/session", isAuthenticate, validator(sessionDeclareNoResultValidator), declareSessionNoResult);
router.post("/unDeclare/result/session", isAuthenticate, validator(sessionUnDeclareValidator), unDeclareSessionResult);
router.get("/", isAuthenticate, getPlacedBets);

module.exports = router;
