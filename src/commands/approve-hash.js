const ethers = require('ethers')

module.exports = (config) => (safeAddress, hashToApprove) => {
  const {
    gasPrice,
    wallet,
    contracts: { gnosisSafeAbi },
  } = config

  const safeContract = new ethers.Contract(safeAddress, gnosisSafeAbi, wallet)

  return safeContract.approveHash(hashToApprove, {
    gasPrice,
  })
}
