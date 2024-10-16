const express = require('express');
const router = express.Router();

const validator = require('../middleware/joi.validator');

const { isAuthenticate } = require('../middleware/auth');

const { notification, banner } = require('../validators/generalValidator');
const { addNotification, getNotification, addBannerData } = require('../controllers/generalController');

router.post('/notification/add', isAuthenticate, validator(notification), addNotification);
router.post('/banner/add', isAuthenticate, validator(banner), addBannerData);
router.get('/notification', getNotification);

module.exports = router;