const express = require('express');
const router = express.Router();

const validator = require('../middleware/joi.validator');

const { isAuthenticate } = require('../middleware/auth');

const {addsessionBettingValidator,updateSessionBettingValidator, UpdateSessionstatusValidator} = require("../validators/sessionValidator")
const {addSession,updateSession, getSessions, updateMarketSessionActiveStatus} = require("../controllers/sessionController")

// @route add session route
router.post('/add',isAuthenticate,validator(addsessionBettingValidator),addSession);

router.post('/update',isAuthenticate,validator(updateSessionBettingValidator),updateSession)

router.get('/:matchId',isAuthenticate,getSessions);
router.post('/status/:id',isAuthenticate,validator(UpdateSessionstatusValidator),updateMarketSessionActiveStatus);

module.exports = router;