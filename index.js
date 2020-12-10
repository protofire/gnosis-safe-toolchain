const getConfig = require('./src/config')
const commands = require('./src/commands')

// { [rpcUrl, provider], walletPk, owners, threshold, gasPrice, networkType, networkId, safeAddress }
module.exports = (conf) => {
  const config = getConfig(conf)

  return {
    config,
    commands: commands(config),
  }
}
