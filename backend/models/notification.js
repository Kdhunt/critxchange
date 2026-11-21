module.exports = (sequelize, DataTypes) => {
    const Notification = sequelize.define('Notification', {
        accountId: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        category: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: 'system',
        },
        sender: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: 'System',
        },
        title: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        body: {
            type: DataTypes.TEXT,
            allowNull: false,
        },
        previewText: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        isRead: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
        },
        metadata: {
            type: DataTypes.JSON,
            allowNull: true,
        },
    });

    Notification.associate = (models) => {
        Notification.belongsTo(models.Account, {
            foreignKey: 'accountId',
            as: 'account',
            onDelete: 'CASCADE',
        });
    };

    return Notification;
};
