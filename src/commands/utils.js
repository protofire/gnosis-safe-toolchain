const ethers = require('ethers')

const byteGasCosts = (hexValue) => {
  // TODO: adjust for Istanbul hardfork (https://eips.ethereum.org/EIPS/eip-2028)
  // Note: this is only supported with the latest ganache versions
  switch(hexValue) {
      case "0x": return 0
      case "00": return 4
      default: return 68
  }
}

const calcDataGasCosts = (dataString) => {
  const reducer = (accumulator, currentValue) => accumulator += byteGasCosts(currentValue)
  return dataString.match(/.{2}/g).reduce(reducer, 0)
}

const estimateBaseGas = (safeContract, to, value, data, operation, txGasEstimate, gasPrice, gasToken, refundReceiver, signatureCount, nonce) => {
  // TODO: adjust for Istanbul hardfork (https://eips.ethereum.org/EIPS/eip-2028)
  // Note: this is only supported with the latest ganache versions
  // numbers < 256 are 192 -> 31 * 4 + 68
  // numbers < 65k are 256 -> 30 * 4 + 2 * 68
  // For signature array length and baseGasEstimate we already calculated the 0 bytes so we just add 64 for each non-zero byte
  let signatureCost = signatureCount * (68 + 2176 + 2176 + 6000) // (array count (3 -> r, s, v) + ecrecover costs) * signature count
  let payload = safeContract.interface.encodeFunctionData('execTransaction',[
      to, value, data, operation, txGasEstimate, ethers.constants.AddressZero, gasPrice, gasToken, refundReceiver, "0x"
  ])
  let baseGasEstimate = calcDataGasCosts(payload) + signatureCost + (nonce > 0 ? 5000 : 20000)
  baseGasEstimate += 1500 // 1500 -> hash generation costs
  baseGasEstimate += 1000 // 1000 -> Event emission
  return baseGasEstimate + 32000; // Add aditional gas costs (e.g. base tx costs, transfer costs)
}

module.exports = {
  estimateBaseGas,
  calcDataGasCosts,
  byteGasCosts
}
