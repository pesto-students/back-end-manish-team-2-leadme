
const db = require('../../models/index');
const User = db.sequelize.models.user;
const Wallet = db.sequelize.models.wallet;
const Loan = db.sequelize.models.loan;
const gatewayTransaction = db.sequelize.models.gatewayTransaction;
const walletTransaction = db.sequelize.models.walletTransaction;
const repaymentSchedule = db.sequelize.models.repaymentSchedule;

const { DEPOSIT, WITHDRAWAL, REPAYMENT, INVEST, BORROW, INCOME } = require('../../config/constants').walletTransactionTypes;
const { REQUESTED, ACTIVE, COMPLETED, EXPIRED, DISABLED } = require('../../config/constants').loanStatus;

const { Model, Op } = require('sequelize');
const { buildRes, errLogger, round } = require('../../utils');

/**
 * @route GET api/loan
 * @desc Register user
 */
exports.getLoan = (req, res) => {
    let offset = req.query?.offset ?? 0;
    let limit = req.query?.limit ?? 10;
    const where = {};

    if(req.query?.amountGte) {
        where.amount = {
            [Op.and]: {
                [Op.gte]: req.query?.amountGte ?? 0,
            }
        }
    }

    Loan.findAll({limit: limit, offset: offset, where: where, include:[
        { model: User, as: 'borrower'}, { model: User, as: 'lender'}
    ]})
        .then(loans => {
            if (!loans instanceof Model){
                return res.status(200).json(buildRes({message: 'No loans found'}));
            } 
            return res.status(200).json(buildRes({success: true, loans: loans}));
        })
        .catch(err => {
            errLogger(err)
            res.status(500).json(buildRes({message: err.message}))
        });
};

/**
 * @route POST api/loan
 * @desc Create new loan
 */
exports.postLoan = (req, res) => {
    const data = { amount, interestRate, payoutFrequency, emiStartDate, tenureMonths, expiryDate, maturityDate, purpose, description } = req.body;
    data.borrowerUserId = req.user.id
    const newLoan = new Loan(data);

    newLoan.save()
        .then(loan => res.status(200).json(buildRes({success: true, loan: loan})))
        .catch(err => {
            errLogger(err)
            res.status(500).json(buildRes({message: err.message}))
        });
};

/**
 * @route GET api/loan/:loanId
 * @desc loan details with RPS
 */
 exports.loanDetails = (req, res) => {
    Loan.findOne({ where: {id: req.params.loanId}, include:[
        { association: 'rps'}, {association: 'lender'}, {association: 'borrower'}
    ]})
        .then(loansDetails => {
         if (!loansDetails){
                return res.status(200).json(buildRes({message: 'No loans found'}));
            } 
            return res.status(200).json(buildRes({success: true, loan: loansDetails}));   
        })
        .catch(err => {
            errLogger(err)
            res.status(500).json(buildRes({message: err.message}))
        });
};


/**
 * @route POST api/loan/:loanId/invest
 * @desc invest in a loan
 */
 exports.invest = async (req, res) => {
    const loan = await Loan.findOne({ where: {id: req.params.loanId}});
    if(!loan.id){
        return res.status(200).json(buildRes({message: 'No loan found'}));
    }

    if(loan.borrowerUserId == req.user.id){
        return res.status(200).json(buildRes({message: 'You cant invest in your own loan'}));
    }

    if(loan.lenderUserId){
        return res.status(200).json(buildRes({message: 'Loan is already invested, please try another'}));
    }

    const lenderWallet = await Wallet.findOne({where: {userId: req.user.id}});
    if(round(lenderWallet.amount - loan.amount, 2) < 0){
        return res.status(200).json(buildRes({message: 'Insufficent balance, please add money to invest'}));
    }

    const loanAmount = round(loan.amount, 2);
    const borrowerWallet = await Wallet.findOne({where: {userId: loan.borrowerUserId}});
    const t = await db.sequelize.transaction();
    
    try {
        //make invest money txn
        const lenderPostTxnBalance = round(lenderWallet.amount - loanAmount, 2);
        let lenderTxnData = {
            type: INVEST,
            amount: loanAmount,
            walletId: lenderWallet.id,
            postTransactionBalance: lenderPostTxnBalance,
            referanceId: loan.id,
        };
        let investTxn = new walletTransaction(lenderTxnData);
        await investTxn.save();

        //substract lender wallet
        await lenderWallet.update({amount: lenderPostTxnBalance});

        //make borrow money txn
        const borrowerPostTxnBalance = round(borrowerWallet.amount + loanAmount, 2);
        let borrowerTxnData = {
            type: BORROW,
            amount: loanAmount,
            walletId: borrowerWallet.id,
            postTransactionBalance: borrowerPostTxnBalance,
            referanceId: loan.id,
        };
        let borrowTxn = new walletTransaction(borrowerTxnData);
        await borrowTxn.save();
        
        //add borrowr wallet
        await borrowerWallet.update({amount: borrowerPostTxnBalance});

        //update loan
        await loan.update({lenderUserId: req.user.id, loanStatus: ACTIVE});

        t.commit();
        return res.status(200).json(buildRes({success: true, message: 'Hurray! Investment is done'}));
    } catch (err) {
        await t.rollback();
        errLogger(err);
        return res.status(500).json(buildRes({message: err.message}));
    }
};

/**
 * @route POST api/loan/:loanId/repayment/:installmentNo
 * @desc invest in a loan
 */
 exports.repayment = async (req, res) => {
    const {loanId, installmentNo} = req.params;
    const loan = await Loan.findOne({ where: {id: loanId}, include: [{ association: 'rps'}]});

    console.log(loan);
    if(!loan.id){
        return res.status(200).json(buildRes({message: 'No loan found'}));
    }

    if(loan.loanStatus != ACTIVE){
        return res.status(200).json(buildRes({message: "Loan is not in Active state"}));
    }

    if(loan.borrowerUserId == req.user.id){
        return res.status(200).json(buildRes({message: "You cant repay someone else loan"}));
    }

    const installment = loan.rps.find(r => r.installment = installmentNo);
    if(installment.isPaid){
        return res.status(200).json(buildRes({message: "Installment already paid"}));
    }

    const installmentAmount = round(installment.amount, 2);
    const lenderWallet = await Wallet.findOne({where: {userId: loan.lenderUserId}});
    const borrowerWallet = await Wallet.findOne({where: {userId: loan.borrowerUserId}});

    if(round(borrowerWallet.amount - installmentAmount, 2) < 0){
        return res.status(200).json(buildRes({message: 'Insufficent balance, please add money to repay'}));
    }

    const t = await db.sequelize.transaction();
    
    try {
        //make repayment
        const lenderPostTxnBalance = round(lenderWallet.amount + installmentAmount, 2);
        let lenderTxnData = {
            type: INCOME,
            amount: installmentAmount,
            walletId: lenderWallet.id,
            postTransactionBalance: lenderPostTxnBalance,
            referanceId: installment.id,
        };
        let investTxn = new walletTransaction(lenderTxnData);
        await investTxn.save();

        //substract lender wallet
        await lenderWallet.update({amount: lenderPostTxnBalance});

        //make borrow money txn
        const borrowerPostTxnBalance = round(borrowerWallet.amount - installmentAmount, 2);
        let borrowerTxnData = {
            type: REPAYMENT,
            amount: installmentAmount,
            walletId: borrowerWallet.id,
            postTransactionBalance: borrowerPostTxnBalance,
            referanceId: installment.id,
        };
        let borrowTxn = new walletTransaction(borrowerTxnData);
        await borrowTxn.save();
        
        //add borrowr wallet
        await borrowerWallet.update({amount: borrowerPostTxnBalance});

        //update installment
        let paymentDate = new Date().toISOString().split('T')[0];
        await installment.update({isPaid: true, paymentDate: paymentDate});

        //update loan
        const paidAmount = round(installmentAmount + loan.paidAmount, 2);
        await loan.update({paidAmount: paidAmount});

        t.commit();
        return res.status(200).json(buildRes({success: true, message: 'Repayment done successfully'}));
    } catch (err) {
        await t.rollback();
        errLogger(err);
        return res.status(500).json(buildRes({message: err.message}));
    }
};