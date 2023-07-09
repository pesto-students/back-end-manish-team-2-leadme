const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { round } = require('../utils');
const DataTypes = require('sequelize').DataTypes;
const roundColumns = ['amount'];

const Wallet =  (sequelize) => {
    const Wallet = sequelize.define( "wallet", {
        userId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: sequelize.models.user,
                key: 'id'
            }
        },
        amount: {
            type: DataTypes.FLOAT,
            defaultValue: 0,
            allowNull: false,
        },
        isActive: {
            type: DataTypes.BOOLEAN,
            defaultValue: true,
            allowNull: false
        },
    }, {
        timestamps: true,
        indexes: [
            {fields: ['userId']}
        ]
    })

    Wallet.associate = models => {
        Wallet.belongsTo(models.user, {foreignKey: 'userId', as: 'wallet'});
        Wallet.hasMany(models.walletTransaction, {foreignKey: 'id', as: 'walletTransactions'});
    }

    Wallet.addHook('beforeCreate', function(wallet) {
        Object.keys(wallet).forEach(key => {
            if(roundColumns.includes(key) && wallet[key]) wallet[key] = round(wallet[key], 2);
        });
    });

    Wallet.addHook('beforeUpdate', function(wallet) {
        Object.keys(wallet).forEach(key => {
            if(roundColumns.includes(key) && wallet[key]) wallet[key] = round(wallet[key], 2);
        });
    });
    
    return Wallet;
}
module.exports = Wallet;