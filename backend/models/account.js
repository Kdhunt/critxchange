module.exports = (sequelize, DataTypes) => {
    const Account = sequelize.define('Account', {
        username: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
        },
        email: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
        },
        password: {
            type: DataTypes.STRING,
            allowNull: true, // Allow null for OAuth-only accounts
        },
        mfaSecret: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        mfaEnabled: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
        },
        passwordResetToken: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        passwordResetExpires: {
            type: DataTypes.DATE,
            allowNull: true,
        },
        googleId: {
            type: DataTypes.STRING,
            allowNull: true,
            unique: true,
        },
    });

    Account.associate = (models) => {
        Account.hasOne(models.Profile, {
            foreignKey: 'accountId',
            as: 'profile',
            onDelete: 'CASCADE',
            hooks: true,
        });

        Account.hasMany(models.Notification, {
            foreignKey: 'accountId',
            as: 'notifications',
            onDelete: 'CASCADE',
        });
    };

    return Account;
};
