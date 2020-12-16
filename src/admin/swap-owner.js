const assert = require('assert')
const ethers = require('ethers')
const { SENTINEL_OWNERS, CALL } = require('../util/constants')

module.exports = (toolchain) => async (safeAddress, oldOwner, newOwner) => {
  assert(
    safeAddress &&
      ethers.utils.isAddress(safeAddress) &&
      safeAddress !== ethers.constants.AddressZero,
    `Invalid safe address`
  )
  assert(
    oldOwner &&
      ethers.utils.isAddress(oldOwner) &&
      oldOwner !== ethers.constants.AddressZero &&
      oldOwner !== SENTINEL_OWNERS,
    `Invalid owner`
  )
  assert(
    newOwner &&
      ethers.utils.isAddress(newOwner) &&
      newOwner !== ethers.constants.AddressZero &&
      newOwner !== SENTINEL_OWNERS,
    `Invalid owner`
  )

  const {
    wallet,
    contracts: { gnosisSafeAbi },
  } = toolchain.config
  const safeContract = new ethers.Contract(safeAddress, gnosisSafeAbi, wallet)

  const currentOwners = (await safeContract.getOwners()).map((o) => o.toLowerCase())

  assert(currentOwners.includes(oldOwner.toLowerCase()), `Not an owner`)
  assert(!currentOwners.includes(newOwner.toLowerCase()), `Address is already an owner`)

  const i = currentOwners.indexOf(oldOwner.toLowerCase())
  const prevOwner = i > 0 ? currentOwners[i - 1] : SENTINEL_OWNERS

  const encodedFunctionData = safeContract.interface.encodeFunctionData('swapOwner', [
    prevOwner,
    oldOwner,
    newOwner,
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
