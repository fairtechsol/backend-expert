const express = require('express');
const router = express.Router();

const validator = require('../middleware/joi.validator');

const { isAuthenticate } = require('../middleware/auth');

const { notification } = require('../validators/generalValidator');
const { addNotification, getNotification } = require('../controllers/generalController');

router.post('/notification/add', isAuthenticate, validator(notification), addNotification);
router.get('/notification', getNotification);

module.exports = router;