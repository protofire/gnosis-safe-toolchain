const assert = require('assert')
const ethers = require('ethers')
const ethUtil = require('ethereumjs-util')
const abi = require('ethereumjs-abi')

const getCreationData = async (owners, threshold, gasToken, creationNonce, config) => {
  const {
    gasPrice,
    provider,
    wallet,
    logger,
    contracts: {
      gnosisSafeAbi,
      gnosisSafeAddress,
      gnosisSafeProxyFactoryAddress,
      gnosisSafeProxyFactoryAbi,
      gnosisSafeProxy,
    },
  } = config

  const gnosisSafeContract = new ethers.Contract(gnosisSafeAddress, gnosisSafeAbi, wallet)
  const gnosisSafeProxyFactoryContract = new ethers.Contract(
    gnosisSafeProxyFactoryAddress,
    gnosisSafeProxyFactoryAbi,
    wallet
  )

  let gnosisSafeData = await gnosisSafeContract.interface.encodeFunctionData('setup', [
    owners,
    threshold,
    ethers.constants.AddressZero,
    '0x',
    ethers.constants.AddressZero,
    gasToken,
    0,
    ethers.constants.AddressZero,
  ])

  const userCosts = (
    await gnosisSafeProxyFactoryContract.estimateGas.createProxyWithNonce(
      gnosisSafeAddress,
      gnosisSafeData,
      creationNonce
    )
  )
    .mul(gasPrice)
    .add(14000)

  gnosisSafeData = await gnosisSafeContract.interface.encodeFunctionData('setup', [
    owners,
    threshold,
    ethers.constants.AddressZero,
    '0x',
    ethers.constants.AddressZero,
    gasToken,
    userCosts,
    ethers.constants.AddressZero,
  ])

  const proxyCreationCode = await gnosisSafeProxyFactoryContract.proxyCreationCode()
  assert(proxyCreationCode, gnosisSafeProxy.bytecode)

  const constructorData = abi.rawEncode(['address'], [gnosisSafeAddress]).toString('hex')

  const encodedNonce = abi.rawEncode(['uint256'], [creationNonce]).toString('hex')

  const target = `0x${ethUtil
    .generateAddress2(
      gnosisSafeProxyFactoryAddress,
      ethUtil.keccak256(`0x${ethUtil.keccak256(gnosisSafeData).toString('hex')}${encodedNonce}`),
      proxyCreationCode + constructorData
    )
    .toString('hex')}`

  logger.log(`    Predicted safe address: ${target}`)

  assert((await provider.getCode(target)) === '0x')

  return {
    safe: target,
    data: gnosisSafeData,
    gasToken,
    userCosts,
    gasPrice,
    creationNonce,
  }
}

const deployWithCreationData = async (gnosisSafeProxyFactoryContract, creationData, config) => {
  const {
    gasPrice,
    logger,
    contracts: { gnosisSafeAddress },
  } = config

  const tx = await gnosisSafeProxyFactoryContract.createProxyWithNonce(
    gnosisSafeAddress,
    creationData.data,
    creationData.creationNonce,
    {
      gasPrice,
    }
  )

  const result = await tx.wait()

  logger.log('    Deplyment Tx: ', result)
  logger.log('    Deployed address: ', result.events[0].args.proxy)

  return result.events[0].args.proxy
}

module.exports = (config) => async (owners, threshold, creationNonce) => {
  const {
    gasPrice,
    wallet,
    provider,
    logger,
    contracts: { gnosisSafeProxyFactoryAddress, gnosisSafeProxyFactoryAbi },
  } = config

  const gnosisSafeProxyFactoryContract = new ethers.Contract(
    gnosisSafeProxyFactoryAddress,
    gnosisSafeProxyFactoryAbi,
    wallet
  )

  const creationNonceOrNow = creationNonce || new Date().getTime()
  logger.log('    Creation Nonce: ', creationNonceOrNow)

  const creationData = await getCreationData(
    owners,
    threshold,
    ethers.constants.AddressZero,
    creationNonceOrNow,
    config
  )

  // User funds safe
  let sendingTx = await wallet.sendTransaction({
    to: creationData.safe,
    value: creationData.userCosts,
    gasPrice,
  })
  await sendingTx.wait()

  // Weird hack for confirming previous transfer
  sendingTx = await wallet.sendTransaction({
    to: creationData.safe,
    value: ethers.utils.parseUnits('1', 'gwei'),
    gasPrice,
  })
  await sendingTx.wait()

  const futureSafeBalance = await provider.getBalance(creationData.safe)
  logger.log('    Safe balance: ', futureSafeBalance.toString())

  return deployWithCreationData(gnosisSafeProxyFactoryContract, creationData, config)
}

module.exports.getCreationData = (config) => (owners, threshold, creationNonce) =>
  getCreationData(owners, threshold, ethers.constants.AddressZero, creationNonce, config)
