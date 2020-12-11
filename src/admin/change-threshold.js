// changeThreshold
const assert = require('assert')
const ethers = require('ethers')
const { CALL } = require('../util/constants')

module.exports = (toolchain) => async (safeAddress, threshold) => {
  assert(
    safeAddress &&
      ethers.utils.isAddress(safeAddress) &&
      safeAddress !== ethers.constants.AddressZero,
    `Invalid safe address`
  )

  assert(threshold, `Threshold needs to be greater than 0`)

  const thresholdToSend = ethers.BigNumber.from(threshold)

  const {
    wallet,
    contracts: { gnosisSafeAbi },
  } = toolchain.config
  const safeContract = new ethers.Contract(safeAddress, gnosisSafeAbi, wallet)

  const currentOwners = (await safeContract.getOwners()).map((o) => o.toLowerCase())

  assert(thresholdToSend.lte(currentOwners.length), 'Threshold cannot exceed owner count')

  const encodedFunctionData = safeContract.interface.encodeFunctionData('changeThreshold', [
    thresholdToSend,
  ])

  const { transactionHash, txData } = await toolchain.commands.transactionData(safeAddress, {
    to: safeAddress,
    value: '0',
    data: encodedFunctionData,
    operation: CALL,
  })

  return {
    encodedFunctionData,
    transactionHash,
    txData,
    approve: () => toolchain.commands.approveHash(safeAddress, transactionHash),
    execute: (approvers) =>
      toolchain.commands.executeTransaction(safeAddress, {
        ...txData,
        approvers,
      }),
  }
}
