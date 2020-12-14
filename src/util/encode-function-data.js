const ethers = require('ethers')

module.exports = (abi, address, wallet, functionName, params = []) => {
  const contract = new ethers.Contract(address, abi, wallet)

  return contract.interface.encodeFunctionData(functionName, params)
}
