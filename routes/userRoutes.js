const express = require('express');
const router = express.Router();

const validator = require('../middleware/joi.validator')
const {CreateUser, ChangePassword} = require('../validators/userValidator');
const {createUser, changePassword} = require('../controllers/userController');

const { isAuthenticate } = require('../middleware/auth');




router.post('/add',validator(CreateUser),createUser);
router.post('/changePassword',isAuthenticate,validator(ChangePassword),changePassword);

module.exports = router;
//https://3100dev.fairgame.club/fair-game-wallet/getUserBalanceDetails
