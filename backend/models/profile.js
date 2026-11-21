module.exports = (sequelize, DataTypes) => {
    const Profile = sequelize.define('Profile', {
        accountId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            unique: true,
        },
        displayName: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        slug: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
        },
        bio: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        services: {
            type: DataTypes.JSON,
            allowNull: false,
            defaultValue: [],
        },
        avatarUrl: {
            type: DataTypes.STRING,
            allowNull: true,
        },
    });

    Profile.associate = (models) => {
        Profile.belongsTo(models.Account, {
            foreignKey: 'accountId',
            as: 'account',
            onDelete: 'CASCADE',
        });
    };

    return Profile;
};
