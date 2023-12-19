const express = require('express');
const router = express.Router();

const validator = require('../middleware/joi.validator');

const { isAuthenticate } = require('../middleware/auth');
const { createMatch, updateMatch, listMatch, matchDetails } = require('../controllers/matchController');
const {  updateMatchValidate, addMatchValidate } = require('../validators/matchValidator');




router.post('/add',isAuthenticate,validator(addMatchValidate),createMatch);
router.post('/update',isAuthenticate,validator(updateMatchValidate),updateMatch);
router.get('/list',isAuthenticate,listMatch);
router.get('/:id',isAuthenticate,matchDetails);

module.exports = router;
