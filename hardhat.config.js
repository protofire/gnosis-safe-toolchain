/* eslint-disable import/no-extraneous-dependencies */
require('dotenv').config()
require('@nomiclabs/hardhat-waffle')

if (!process.env.RPC_URL) {
  throw new Error('Missing RPC_URL')
}

const { PKS } = require('./test/utils')

module.exports = {
  networks: {
    hardhat: {
      forking: {
        url: process.env.RPC_URL,
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
