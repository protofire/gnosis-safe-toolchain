const ethers = require('ethers')

module.exports = (toolchain) => async (safeAddress) => {
  const {
    wallet,
    contracts: { gnosisSafeAbi },
  } = toolchain.config

  const safeContract = new ethers.Contract(safeAddress, gnosisSafeAbi, wallet)

  return safeContract.getThreshold()
}
