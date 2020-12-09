const ethers = require('ethers')
const { estimateBaseGas, calcDataGasCosts } = require('./utils')

async function getTxGasEstimate(provider, safeContract, to, value, data, operation) {
  let txGasEstimate = 0
  let estimateData = safeContract.interface.encodeFunctionData('requiredTxGas',[to, value, data, operation])
  try {
      let estimateResponse = await provider.call({
          to: safeContract.address,
          from: safeContract.address,
          data: estimateData,
          gasPrice: 0,
      })

      txGasEstimate = ethers.BigNumber.from('0x' + estimateResponse.substring(138))
      // Add 10k else we will fail in case of nested calls
      txGasEstimate = txGasEstimate.toNumber() + 10000
  } catch(e) {
      console.log("    Could not estimate cause: " + e)
  }

  if (txGasEstimate > 0) {
    let estimateDataGasCosts = calcDataGasCosts(estimateData)
    let additionalGas = 10000
    // To check if the transaction is successfull with the given safeTxGas we try to set a gasLimit so that only safeTxGas is available,
    // when `execute` is triggered in `requiredTxGas`. If the response is `0x` then the inner transaction reverted and we need to increase the amount.
    for (let i = 0; i < 100; i++) {
        try {
            let estimateResponse = await provider.call({
              to: safeContract.address,
              from: safeContract.address,
              data: estimateData,
              gasPrice: 0,
              gasLimit: txGasEstimate + estimateDataGasCosts + 21000 // gasLimit: We add 21k for base tx costs
            })

            if (estimateResponse != "0x") break
        } catch(e) {
            console.log("    Could simulate cause: " + e)
        }

        txGasEstimate += additionalGas
        additionalGas *= 2
    }
  }

  console.log("    Tx Gas estimate: " + txGasEstimate)

  return txGasEstimate
}

module.exports = (config) => async (safeAddress, { to, value, data, operation, nonce}) => {
  const {
    gasPrice,
    threshold,
    wallet,
    provider,
    contracts: {
      gnosisSafeAbi
    }
  } = config

  const safeContract = new ethers.Contract(safeAddress, gnosisSafeAbi, wallet)

  const transactionNonce = nonce ? nonce : await safeContract.nonce()

  let txGasEstimate = await getTxGasEstimate(provider, safeContract, to, value, data, operation)

  let baseGasEstimate = estimateBaseGas(
    safeContract,
    to,
    value,
    data,
    operation,
    txGasEstimate,
    gasPrice,
    ethers.constants.AddressZero,
    ethers.constants.AddressZero,
    threshold,
    transactionNonce
  )

  console.log("    Base Gas estimate: " + baseGasEstimate)

  const transactionHash = await safeContract.getTransactionHash(
    to,
    value,
    data,
    operation,
    txGasEstimate,
    baseGasEstimate,
    gasPrice,
    ethers.constants.AddressZero,
    ethers.constants.AddressZero,
    transactionNonce
  )

  console.log("    Transaction Hash: ", transactionHash)

  return {
    transactionHash,
    txData: {
      to,
      value,
      data,
      operation,
      txGasEstimate,
      baseGasEstimate,
      transactionNonce
    }
  }

}
