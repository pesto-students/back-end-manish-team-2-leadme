const User = require('../../models/index').user;


/**
 * @route GET api/user
 * @desc Register user
 */
exports.getUser = (req, res) => { 

    User.findOne({ where: {id: req.params.userId}})
        .then(userDetails => {
            if (!userDetails){
                return res.status(200).json(buildRes({message: 'No user found'}));
            } 
            return res.status(200).json(buildRes({success: true, user: userDetails}));
        })
        .catch(error => {
            errLogger(err)
            res.status(500).json(buildRes({message: err.message}))
        })
}

exports.getAllUsers = (req, res) => {
    User.find({})
        .then(userDetails => {
            if (!userDetails){
                return res.status(200).json(buildRes({message: 'No user found'}));
            } 
            return res.status(200).json(buildRes({success: true, user: userDetails}));
        })
        .catch(error => {
            errLogger(err)
            res.status(500).json(buildRes({message: err.message}))
        })
    }