const { generateRPS } = require('../lib/rpsLib');
const { errLogger } = require('../utils');
const User = require('./index').user;
const DataTypes = require('sequelize').DataTypes;

const Loan =  (sequelize) => {
    const Loan = sequelize.define( "loan", {
        borrowerUserId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: User, // 'Movies' would also work
                key: 'id'
            }
        },
        lenderUserId: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: {
                model: User, // 'Movies' would also work
                key: 'id'
            }
        },
        loanStatus: {
            type: DataTypes.ENUM('Requested', 'Expired', 'Active', 'Completed'),
            defaultValue: 'Requested',
            allowNull: false,
        },
        amount: {
            type: DataTypes.INTEGER.UNSIGNED,
            allowNull: false,
        },
        interestRate: {
            type: DataTypes.FLOAT(4, 2).UNSIGNED,
            allowNull: false,
        },
        payoutFrequency : {
            type: DataTypes.ENUM('Monthly', 'Quaterly'),
            allowNull: false,
        },
        emiStartDate: {
            type: DataTypes.DATEONLY,
            allowNull: false,
        },
        tenureMonths: {
            type: DataTypes.SMALLINT.UNSIGNED,
            allowNull: false,
        },
        expiryDate: {
            type: DataTypes.DATE,
            allowNull: false,
        },
        maturityDate: {
            type: DataTypes.DATE,
            allowNull: false,
        },
        purposeId: {
            type: DataTypes.INTEGER.UNSIGNED,
        },
        description: {
            type: DataTypes.TEXT,
            allowNull: true,
            default: null,
        },
        agreementUrl: {
            type: DataTypes.STRING(1024),
            allowNull: true,
            default: null,
        }
    }, {
        timestamps: true,
        indexes: [
            {
                fields: ['borrowerUserId'],
            },
        ],
    })
    
    Loan.associate = function(models) {
        Loan.belongsTo(models.user, {foreignKey: 'borrowerUserId', as: 'borrower'})
        Loan.belongsTo(models.user, {foreignKey: 'lenderUserId', as: 'lender'})
        Loan.hasMany(models.repaymentSchedule , {foreignKey: 'loanId', as: 'rps'});
    };

    //generate RPS
    Loan.addHook('afterCreate', function(loan) {
        let rps = generateRPS(loan);
        rps = rps.map(installment => ({ ...installment, loanId: loan.id, is_paid: false }));
        rps.forEach(rpsInstallment => {
            installment = new sequelize.models.repaymentSchedule(rpsInstallment);
            installment.save().catch(err => {
                errLogger(err)
            });;
        });
    });

    return Loan;
}
module.exports = Loan;