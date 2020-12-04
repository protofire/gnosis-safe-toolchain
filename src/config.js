const assert = require('assert')
const ethers = require('ethers')

// { rpcUrl, walletPk, owners, threshold, gasPrice, networkType, networkId }
module.exports = (config) => {
  const configKeys = ['rpcUrl', 'walletPk', 'owners', 'threshold', 'gasPrice', 'networkType', 'networkId']
  configKeys.forEach(key => {
    assert(config[key], `missing configuration param ${key}`)
  });

  const contracts = require('./contracts')(config.networkType, config.networkId)

  const provider = new ethers.providers.JsonRpcProvider(config.rpcUrl)
  const wallet = new ethers.Wallet(config.walletPk, provider)

  return {
    ...config,
    gasPrice: ethers.utils.parseUnits(config.gasPrice, 'gwei'),
    contracts,
    provider,
    wallet,
  }
}
