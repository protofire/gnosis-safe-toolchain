const assert = require('assert')
const ethers = require('ethers')
const { SENTINEL_OWNERS, CALL } = require('../util/constants')

module.exports = (toolchain) => async (safeAddress, owner, threshold) => {
  assert(
    safeAddress &&
      ethers.utils.isAddress(safeAddress) &&
      safeAddress !== ethers.constants.AddressZero,
    `Invalid safe address`
  )
  assert(
    owner &&
      ethers.utils.isAddress(owner) &&
      owner !== ethers.constants.AddressZero &&
      owner !== SENTINEL_OWNERS,
    `Invalid owner`
  )

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

  assert(currentOwners.includes(owner.toLowerCase()), `Not an owner`)

  const i = currentOwners.indexOf(owner.toLowerCase())
  const prevOwner = i > 0 ? currentOwners[i - 1] : SENTINEL_OWNERS

  if (typeof threshold !== 'undefined') {
    thresholdToSend = ethers.BigNumber.from(threshold)
  }

  assert(thresholdToSend.gt(0), `Threshold needs to be greater than 0`)
  assert(
    thresholdToSend.lte(currentOwners.length - 1),
    `New owner count needs to be larger than new threshold`
  )

  const encodedFunctionData = safeContract.interface.encodeFunctionData('removeOwner', [
    prevOwner,
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
