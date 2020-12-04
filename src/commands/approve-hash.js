const ethers = require('ethers')

module.exports = (config) => async (safeAddress, hashToApprove) => {
  const {
    gasPrice,
    wallet,
    contracts: {
      gnosisSafeAbi
    }
  } = config

  const safeContract = new ethers.Contract(safeAddress, gnosisSafeAbi, wallet)

  await safeContract.approveHash(hashToApprove, {
    gasPrice: gasPrice
  })
}
