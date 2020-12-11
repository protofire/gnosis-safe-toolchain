/* eslint-disable import/no-extraneous-dependencies */

require('@nomiclabs/hardhat-waffle')

const { PKS } = require('./test/utils')

module.exports = {
  networks: {
    hardhat: {
      forking: {
        url: 'https://eth-goerli.alchemyapi.io/v2/p1pO1NsKkn0eZ3xSiih_ftF7yXgCWb_H',
      },
      gas: 'auto',
      accounts: PKS.map((privateKey) => ({
        privateKey,
        balance: '1000000000000000000000',
      })),
      throwOnCallFailures: false,
    },
  },
  solc: {
    version: '0.5.17',
  },
}
