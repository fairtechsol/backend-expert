const express = require('express');
const { listMatchSuperAdmin } = require('../controllers/superAdminController');
const router = express.Router();

router.get('/match/list',listMatchSuperAdmin);

module.exports = router;
