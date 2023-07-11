const express = require('express');
const {check} = require('express-validator');
const userController = require('./userController');
const paramsValidator = require('../../middlewares/paramsValidator');

const router = express.Router();

router.get('/:userId', [
    check('userId').notEmpty().withMessage("User id is missing"),
], paramsValidator, userController.getUser)

router.put('/:userId', [
    check('userId').notEmpty().withMessage("User id is missing"),
], paramsValidator, userController.updateUserData)

router.put('/changePass/:userId', [
    check('userId').notEmpty().withMessage("User id is missing"),
], paramsValidator, userController.updatePassword)

module.exports = router;    