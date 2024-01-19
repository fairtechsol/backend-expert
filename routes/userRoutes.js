const express = require('express');
const router = express.Router();

const validator = require('../middleware/joi.validator')
const {CreateUser, ChangePassword, UpdateUser, ChangeSelfPassword} = require('../validators/userValidator');
const {createUser, changePassword, updateUser, changeSelfPassword, expertList, getProfile, totalLoginCount} = require('../controllers/userController');

const { isAuthenticate } = require('../middleware/auth');




router.post('/add',validator(CreateUser),createUser);
router.get('/profile',isAuthenticate, getProfile);
router.post('/update',validator(UpdateUser),updateUser);
router.post('/admin/password',validator(ChangePassword),changePassword);
router.post('/password',isAuthenticate,validator(ChangeSelfPassword),changeSelfPassword);
router.get('/list',expertList);
router.get('/totalLoginCount', isAuthenticate, totalLoginCount)

module.exports = router;
