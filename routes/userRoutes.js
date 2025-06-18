const express = require('express');
const router = express.Router();

const validator = require('../middleware/joi.validator')
const { ChangeSelfPassword, CheckOldPassword} = require('../validators/userValidator');
const { changeSelfPassword, getProfile, totalLoginCount, checkOldPasswordData} = require('../controllers/userController');

const { isAuthenticate } = require('../middleware/auth');




router.get('/profile',isAuthenticate, getProfile);
router.post('/password',isAuthenticate,validator(ChangeSelfPassword),changeSelfPassword);
router.get('/totalLoginCount', isAuthenticate, totalLoginCount)
router.post("/check/oldPassword", isAuthenticate, validator(CheckOldPassword), checkOldPasswordData);

module.exports = router;
