const express = require("express");
const router = express.Router();
const { declareSessionResult, declareSessionNoResult, unDeclareSessionResult, getPlacedBets } = require("../controllers/betController");
const { isAuthenticate } = require("../middleware/auth");

router.post("/declare/result/session", isAuthenticate, declareSessionResult);
router.post("/declare/noResult/session", isAuthenticate, declareSessionNoResult);
router.post("/unDeclare/result/session", isAuthenticate, unDeclareSessionResult);
router.get("/", isAuthenticate, getPlacedBets);

module.exports = router;
