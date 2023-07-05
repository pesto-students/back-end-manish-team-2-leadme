const express = require('express');
const {check} = require('express-validator');
const loanController = require('./loanController');
const paramsValidator = require('../../middlewares/paramsValidator');

const router = express.Router();

router.get('/', paramsValidator, loanController.getLoan);
router.post('/',  [
    check('amount').not().isEmpty().isNumeric().withMessage('Valid Amount required'),
    check('interestRate').not().isEmpty().isFloat({min: 0, max: 99.99}).withMessage('Valid interestRate required'),
    check('payoutFrequency').notEmpty().isIn(['Monthly', 'Quaterly']).withMessage('valid payoutFrequency required'),
    check('emiStartDate').notEmpty().isDate({format: 'YYYY-MM-DD'}).withMessage('valid emiStartDate required in Y-m-d format'),
    check('tenureMonths').notEmpty().isNumeric({min: 1}).withMessage('valid tenureMonths required'),
    check('maturityDate').notEmpty().isDate({format: 'YYYY-MM-DD'}).withMessage('valid maturityDate required in Y-m-d format'),
    check('purposeId').notEmpty().isNumeric().withMessage('valid purposeId required'),
    check('expiryDate').notEmpty().isDate({format: 'YYYY-MM-DD'}).withMessage('valid expiryDate required in Y-m-d format'),
], paramsValidator, loanController.postLoan);

module.exports = router;