const express = require("express");
const router = express.Router();
const { declareSessionResult, declareSessionNoResult } = require("../controllers/betController");
const { isAuthenticate } = require("../middleware/auth");

router.post("/declare/result/session", isAuthenticate, declareSessionResult);
router.post("/declare/noResult/session", isAuthenticate, declareSessionNoResult);

module.exports = router;
