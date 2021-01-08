const ethNetworks = require('@gnosis.pm/safe-contracts/networks.json')
const gnosisSafeAbi = require('./abi/GnosisSafe.json')
const gnosisSafeProxy = require('./abi/GnosisSafeProxy.json')
const gnosisSafeProxyFactoryAbi = require('./abi/GnosisSafeProxyFactory.json')
const iProxyAbi = require('./abi/IProxy.json')
const avaNetworks = require('./ava-networks.json')

// For avalanche networkId should be set to 'mainnet' or 'testnet'
module.exports = (networkType, networkId) => {
  const networks = networkType === 'ethereum' ? ethNetworks : avaNetworks
  const gnosisSafeAddress = networks.GnosisSafe[networkId].address
  const gnosisSafeProxyFactoryAddress = networks.GnosisSafeProxyFactory[networkId].address

  return {
    gnosisSafeAbi,
    gnosisSafeAddress,
    gnosisSafeProxyFactoryAbi,
    gnosisSafeProxyFactoryAddress,
    gnosisSafeProxy,
    iProxyAbi,
  }
}
