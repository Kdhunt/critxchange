'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('Accounts', 'mfaSecret', {
      type: Sequelize.STRING,
      allowNull: true,
    });

    await queryInterface.addColumn('Accounts', 'mfaEnabled', {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
      allowNull: false,
    });

    await queryInterface.addColumn('Accounts', 'passwordResetToken', {
      type: Sequelize.STRING,
      allowNull: true,
    });

    await queryInterface.addColumn('Accounts', 'passwordResetExpires', {
      type: Sequelize.DATE,
      allowNull: true,
    });

    await queryInterface.addColumn('Accounts', 'googleId', {
      type: Sequelize.STRING,
      allowNull: true,
      unique: true,
    });

    // Make password nullable for OAuth-only accounts
    await queryInterface.changeColumn('Accounts', 'password', {
      type: Sequelize.STRING,
      allowNull: true,
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('Accounts', 'mfaSecret');
    await queryInterface.removeColumn('Accounts', 'mfaEnabled');
    await queryInterface.removeColumn('Accounts', 'passwordResetToken');
    await queryInterface.removeColumn('Accounts', 'passwordResetExpires');
    await queryInterface.removeColumn('Accounts', 'googleId');
    
    // Revert password to not null
    await queryInterface.changeColumn('Accounts', 'password', {
      type: Sequelize.STRING,
      allowNull: false,
    });
  }
};

