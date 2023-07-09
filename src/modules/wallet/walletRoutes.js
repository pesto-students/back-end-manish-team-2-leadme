const express = require('express');
const {check} = require('express-validator');
const walletController = require('./walletController');
const paramsValidator = require('../../middlewares/paramsValidator');

const router = express.Router();

router.get('/', paramsValidator, walletController.getWallet);

module.exports = router;