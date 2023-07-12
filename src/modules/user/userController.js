const User = require('../../models/index').user;
const { decryptData, encryptData } = require('../../lib/encryptionLib');
const { buildRes, errLogger } = require('../../utils');
const bcrypt = require('bcrypt');


/**
 * @route GET api/user
 * @desc Register user
 */
exports.getUser = (req, res) => { 
    User.findOne({ where: {id: req.user.id}})
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
    User.findOne({ where: {id: req.user.id}})
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
    User.findOne({ where: {id: req.user.id}})
        .then(async userDetails => {
            if (!userDetails){
                return res.status(200).json(buildRes({message: 'No user found'}));
            } 

            const { newPassword, password } = req.body;

            //compare passswords
            if (userDetails.comparePassword(newPassword)) return res.status(200).json(buildRes({message: 'New password is matching existing password'}));

            userDetails.password= newPassword;  
            userDetails.encryptNewPassword(userDetails);

            await userDetails.save();

            return res.status(200).json(buildRes({success: true, user: userDetails}));
        })
        .catch(error => {
            errLogger(error)
            res.status(500).json(buildRes({message: error.message}))
        })
}
