//centralized routing, apply middleware for module routes

const auth = require('../modules/auth/authRoutes');
const loan = require('../modules/loan/loanRoutes');
const user = require('../modules/user/userRoutes');

const protected = require('./protected');
const authenticate = require('../middlewares/authenticate');
const { buildRes } = require('../utils');

module.exports = app => {
    app.get('/', (req, res) => {
        res.status(200).send(buildRes({ message: "Welcome to the LendMe."}));
    });
    app.use('/api/auth', auth);
    app.use('/api/protected', authenticate, protected);
    app.use('/api/loan', authenticate, loan)
    app.use('/api/user', authenticate, user)
};