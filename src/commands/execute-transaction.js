const assert = require('assert')
const ethers = require('ethers')

module.exports = (config) => async (
  safeAddress,
  { to, value, data, operation, txGasEstimate, baseGasEstimate, approvers }
) => {
  const {
    gasPrice,
    threshold,
    wallet,
    contracts: { gnosisSafeAbi },
  } = config

  assert(approvers.length >= threshold, 'too few approvers')

  const safeContract = new ethers.Contract(safeAddress, gnosisSafeAbi, wallet)

  const sigs = `0x${approvers
    .slice(0, threshold)
    .sort()
    .map(
      (account) =>
        `000000000000000000000000${account.replace(
          '0x',
          ''
        )}000000000000000000000000000000000000000000000000000000000000000001`
    )
    .join('')}`

  return safeContract.execTransaction(
    to,
    value,
    data,
    operation,
    txGasEstimate,
    baseGasEstimate,
    gasPrice,
    ethers.constants.AddressZero, // TODO - txGasToken make this a param
    ethers.constants.AddressZero, // TODO - refundReceiver make this a param
    sigs,
    {
      gasPrice,
    }
  )
}
