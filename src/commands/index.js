const getDeploy = require('./deploy')
const getApproveHash = require('./approve-hash')
const getExecuteTransaction = require('./execute-transaction')
const getTransactionData = require('./get-transaction-hash')

module.exports = (config) => ({
  deploy: getDeploy(config),
  approveHash: getApproveHash(config),
  executeTransaction: getExecuteTransaction(config),
  transactionData: getTransactionData(config)
})
