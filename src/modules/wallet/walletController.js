const User = require('../../models/index').user;
const Wallet = require('../../models/index').wallet;

const { Model, Op } = require('sequelize');
const { buildRes, errLogger } = require('../../utils');

/**
 * @route GET api/user/wallet
 * @desc Get wallet details
 */
exports.getWallet = (req, res) => {
    Wallet.findOne({
        where: {userId: req.user.id},
         include:[
             { association: 'walletTransactions'}
        ]
    })
    .then(wallet => {
        return res.status(200).json(buildRes({success: true, wallet: wallet}));
    })
    .catch(err => {
        errLogger(err)
        res.status(500).json(buildRes({message: err.message, user: req.user}))
    });
};

