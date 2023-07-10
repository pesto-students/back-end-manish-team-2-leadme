const express = require('express');
const {check} = require('express-validator');
const userController = require('./userController');
const paramsValidator = require('../../middlewares/paramsValidator');

const router = express.Router();

router.get('/', paramsValidator, loanController.getLoan);

router.get('/:userId', [
    check('userId').notEmpty().withMessage("Loan id is missing"),
], paramsValidator, userController.getUser)


module.exports = router;