const express = require('express');
const { listMatchSuperAdmin } = require('../controllers/superAdminController');
const {matchDetails}= require('../controllers/matchController');
const router = express.Router();

router.get('/match/list',listMatchSuperAdmin);
router.get('/match/:id',matchDetails);
module.exports = router;
