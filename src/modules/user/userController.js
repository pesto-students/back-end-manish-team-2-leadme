const User = require('../../models/index').user;
const { decryptData, encryptData } = require('../../lib/encryptionLib');
const { buildRes, errLogger } = require('../../utils');

/**
 * @route GET api/user
 * @desc Register user
 */
exports.getUser = (req, res) => { 

    User.findOne({ where: {id: req.params.userId}})
        .then(async userDetails => {
            if (!userDetails){
                return res.status(200).json(buildRes({message: 'No user found'}));
            } 

            if(userDetails.pan){
                userDetails.pan = await decryptData(userDetails.pan);
            }
            if(userDetails.aadhar){
                userDetails.aadhar = await decryptData(userDetails.aadhar);
            }

            return res.status(200).json(buildRes({success: true, user: userDetails}));
        })
        .catch(error => {
            errLogger(error)
            res.status(500).json(buildRes({message: error.message}))
        })
}

exports.updateUserData = (req, res) => { 

    User.findOne({ where: {id: req.params.userId}})
        .then(async userDetails => {
            if (!userDetails){
                return res.status(200).json(buildRes({message: 'No user found'}));
            } 

            const { firstName, lastName, email, mobile } = req.body;

            userDetails.lastName= lastName;   
            userDetails.firstName= firstName;
            userDetails.email= email;
            userDetails.mobile= mobile;

            await userDetails.save();

            return res.status(200).json(buildRes({success: true, user: userDetails}));
        })
        .catch(error => {
            errLogger(error)
            res.status(500).json(buildRes({message: error.message}))
        })
}

exports.updatePassword = (req, res) => {
    User.findOne({ where: {id: req.params.userId}})
        .then(async userDetails => {
            if (!userDetails){
                return res.status(200).json(buildRes({message: 'No user found'}));
            } 

            const { password } = req.body;

            password = await encryptData(password);

            userDetails.password= password;   

            await userDetails.save();

            return res.status(200).json(buildRes({success: true, user: userDetails}));
        })
        .catch(error => {
            errLogger(error)
            res.status(500).json(buildRes({message: error.message}))
        })
}

exports.getAllUsers = (req, res) => {
    User.findAll({})
        .then(userDetails => {
            if (!userDetails){
                return res.status(200).json(buildRes({message: 'No user found'}));
            } 
            return res.status(200).json(buildRes({success: true, user: userDetails}));
        })
        .catch(error => {
            errLogger(error)
            res.status(500).json(buildRes({message: error.message}))
        })
    }