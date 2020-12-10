/* eslint-disable import/no-extraneous-dependencies */

require('@nomiclabs/hardhat-waffle')

module.exports = {
  networks: {
    hardhat: {
      forking: {
        url: 'https://eth-goerli.alchemyapi.io/v2/p1pO1NsKkn0eZ3xSiih_ftF7yXgCWb_H',
      },
      gas: 'auto',
      accounts: [
        {
          privateKey: '0x4f3edf983ac636a65a842ce7c78d9aa706d3b113bce9c46f30d7d21715b23b1d',
          balance: '1000000000000000000000',
        },
        {
          privateKey: '0x6cbed15c793ce57650b9877cf6fa156fbef513c4e6134f022a85b1ffdd59b2a1',
          balance: '1000000000000000000000',
        },
        {
          privateKey: '0x6370fd033278c143179d81c5526140625662b8daa446c22ee2d73db3707e620c',
          balance: '1000000000000000000000',
        },
      ],
      throwOnCallFailures: false,
    },
  },
  solc: {
    version: '0.5.17',
  },
}
