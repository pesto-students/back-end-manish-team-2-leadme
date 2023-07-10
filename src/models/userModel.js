const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const DataTypes = require('sequelize').DataTypes;
const Loan = require('./index').loan;

const User =  (sequelize) => {
    const User = sequelize.define( "user", {
        lastName: {
            type: DataTypes.STRING,
        },
        firstName: {
            type: DataTypes.STRING,
        },
        email: {
            type: DataTypes.STRING,
            unique: true,
            isEmail: true,
            allowNull: false
        },
        password: {
            type: DataTypes.STRING,
            allowNull: false
        },
        panNumber: {
            type: DataTypes.STRING,
            allowNull: false
        },
        adharNumber: {
            type: DataTypes.STRING,
            allowNull: false
        }

    }, {timestamps: true})

    User.associate = models => {
        User.hasMany(models.loan , {foreignKey: 'borrowerUserId', as: 'borrower'});
        User.hasMany(models.loan , {foreignKey: 'lenderUserId', as: 'lender'});

    }
    User.addHook('beforeCreate', function(user) {
        if (user.password) {
            const salt = bcrypt.genSaltSync(10, 'a');
            user.password = bcrypt.hashSync(user.password, salt);
        }
    });

    User.addHook('beforeUpdate', function(user) {
        if (user.password) {
            const salt = bcrypt.genSaltSync(10, 'a');
            user.password = bcrypt.hashSync(user.password, salt);
        }
    });

    User.prototype.comparePassword = function(pass) {
        return bcrypt.compareSync(pass, this.password);
    }

    User.prototype.generateJWT = function() {
        let payload = {
            id: this.id,
            email: this.email,
            firstName: this.firstName,
            lastName: this.lastName,
        };
        return jwt.sign(payload, process.env.JWT_SECRET, {expiresIn: '6h'});
    }

    return User;
}
module.exports = User;