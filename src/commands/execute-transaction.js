const assert = require('assert')
const ethers = require('ethers')

module.exports = (config) => async (
  safeAddress,
  { to, value, data, operation, txGasEstimate, baseGasEstimate, approvers }
) => {
  const {
    gasPrice,
    wallet,
    contracts: { gnosisSafeAbi },
  } = config

  const safeContract = new ethers.Contract(safeAddress, gnosisSafeAbi, wallet)

  const threshold = await safeContract.getThreshold()
  assert(threshold.lte(approvers.length), 'too few approvers')

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
    0, // Transactions without refund
    ethers.constants.AddressZero,
    ethers.constants.AddressZero,
    sigs,
    {
      gasPrice,
    }
  )
}
