const assert = require('assert')
const ethers = require('ethers')
const logger = require('logdown')('GnosisSafeToolchain')
const getContracts = require('./contracts')

// { [rpcUrl | provider], walletPk, owners, threshold, gasPrice, networkType, networkId, logger }
module.exports = (config) => {
  assert(config.rpcUrl || config.provider, `missing rpcUrl or provider`)

  const configKeys = ['walletPk', 'threshold', 'gasPrice', 'networkType', 'networkId']
  configKeys.forEach((key) => {
    assert(config[key], `missing configuration param ${key}`)
  })

  const contracts = getContracts(config.networkType, config.networkId)

  const provider = config.provider || new ethers.providers.JsonRpcProvider(config.rpcUrl)
  const wallet = new ethers.Wallet(config.walletPk, provider)

  logger.state.isEnabled = !!config.logger

  return {
    ...config,
    gasPrice: ethers.utils.parseUnits(config.gasPrice, 'gwei'),
    contracts,
    provider,
    wallet,
    logger,
  }
}
