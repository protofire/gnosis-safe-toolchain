const assert = require('assert')
const ethers = require('ethers')
const { CALL } = require('../util/constants')

module.exports = (toolchain) => async (safeAddress, owner, threshold) => {
  assert(safeAddress && safeAddress !== ethers.constants.AddressZero, `Invalid safe address`)
  assert(owner && owner !== ethers.constants.AddressZero, `Invalid owner`)

  const {
    wallet,
    contracts: { gnosisSafeAbi },
  } = toolchain.config
  const safeContract = new ethers.Contract(safeAddress, gnosisSafeAbi, wallet)

  // eslint-disable-next-line prefer-const
  let [currentOwners, thresholdToSend] = await Promise.all([
    safeContract.getOwners().then((owners) => owners.map((o) => o.toLowerCase())),
    safeContract.getThreshold(),
  ])

  assert(!currentOwners.includes(owner.toLowerCase()), `Address is already an owner`)

  if (typeof threshold !== 'undefined') {
    thresholdToSend = ethers.BigNumber.from(threshold)
    assert(thresholdToSend.gt(0), `Threshold needs to be greater than 0`)
    assert(thresholdToSend.lte(currentOwners.length + 1), `Threshold cannot exceed owner count`)
  }

  const encodedFunctionData = safeContract.interface.encodeFunctionData('addOwnerWithThreshold', [
    owner,
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
