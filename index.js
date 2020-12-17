const getConfig = require('./src/config')
const getCommands = require('./src/commands')
const getAdmin = require('./src/admin')

const util = require('./src/util')

// { [rpcUrl, provider], walletPk, owners, threshold, gasPrice, networkType, networkId, safeAddress }
module.exports = (conf) => {
  const config = getConfig(conf)
  const commands = getCommands(config)
  const admin = getAdmin({ config, commands })

  return {
    config,
    commands,
    admin,
  }
}

module.exports.util = util
