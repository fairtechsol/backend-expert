const express = require("express");
const router = express.Router();
const { declareSessionResult } = require("../controllers/betController");
const { isAuthenticate } = require("../middleware/auth");

router.post("/declare/result/session", isAuthenticate, declareSessionResult);

module.exports = router;
