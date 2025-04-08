const express = require('express');
const { getSessions } = require('../controllers/sessionController');
const { updateDeleteReason } = require('../validators/betsValidator');
const { sendUpdateDeleteReason } = require('../controllers/betController');
const validator = require('../middleware/joi.validator');
const { getBlinkingTabsData } = require('../controllers/blinkingTabsController');
const router = express.Router();


// match racing

router.get('/session/:matchId', getSessions);
//api for get match and match betting details for all super admin backend
router.post("/update/deleteReason", validator(updateDeleteReason), sendUpdateDeleteReason);
router.get("/blinkingTabs", getBlinkingTabsData);

module.exports = router;
