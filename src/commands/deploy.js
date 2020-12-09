const assert = require('assert')
const ethers = require('ethers')
const ethUtil = require('ethereumjs-util')
const abi = require('ethereumjs-abi')

const getCreationData = async function(gnosisSafeContract, gnosisSafeProxyFactoryContract, owners, gasToken, userCosts, creationNonce, config) {
  const {
    gasPrice,
    threshold,
    provider,
    contracts: {
      gnosisSafeAddress,
      gnosisSafeProxy,
      gnosisSafeProxyFactoryAddress,
  } } = config

  gnosisSafeData = await gnosisSafeContract.interface.encodeFunctionData('setup',[
    owners,
    threshold,
    ethers.constants.AddressZero,
    "0x",
    ethers.constants.AddressZero,
    gasToken,
    userCosts,
    ethers.constants.AddressZero
  ])

  let proxyCreationCode = await gnosisSafeProxyFactoryContract.proxyCreationCode()
  assert(proxyCreationCode, gnosisSafeProxy.bytecode)

  let constructorData = abi.rawEncode(
      ['address'],
      [ gnosisSafeAddress ]
  ).toString('hex')

  let encodedNonce = abi.rawEncode(['uint256'], [creationNonce]).toString('hex')

  let target = "0x" + ethUtil.generateAddress2(
    gnosisSafeProxyFactoryAddress,
    ethUtil.keccak256("0x" + ethUtil.keccak256(gnosisSafeData).toString("hex") + encodedNonce),
    proxyCreationCode + constructorData
  ).toString("hex")

  console.log("    Predicted safe address: " + target)

  assert(await provider.getCode(target) === "0x")

  return {
      safe: target,
      data: gnosisSafeData,
      gasToken: gasToken,
      userCosts: userCosts,
      gasPrice: gasPrice,
      creationNonce: creationNonce
  }
}

const deployWithCreationData = async function(gnosisSafeProxyFactoryContract, creationData, config) {
  const {
    gasPrice,
    wallet,
    contracts: {
      gnosisSafeAddress,
      iProxyAbi
  } } = config

  const tx = await gnosisSafeProxyFactoryContract.createProxyWithNonce(
    gnosisSafeAddress, creationData.data, creationData.creationNonce,
    {
      gasPrice: gasPrice,
      gasLimit: 8000000
    }
  )

  const result = await tx.wait()

  console.log("    Deplyment Tx: ", result)
  console.log("    Deployed address: ", result.events[0].args.proxy)

  // const iProxyContract = new ethers.Contract(creationData.safe, iProxyAbi, wallet)
  // assert(await iProxyContract.masterCopy(), gnosisSafeAddress)
}

module.exports = (config) => async (owners) => {
  const {
    gasPrice,
    wallet,
    provider,
    threshold,
    contracts: {
      gnosisSafeAbi,
      gnosisSafeAddress,
      gnosisSafeProxyFactoryAddress,
      gnosisSafeProxyFactoryAbi,
  } } = config

  const gnosisSafeContract = new ethers.Contract(gnosisSafeAddress, gnosisSafeAbi, wallet)
  const gnosisSafeProxyFactoryContract = new ethers.Contract(gnosisSafeProxyFactoryAddress, gnosisSafeProxyFactoryAbi, wallet)

  const gnosisSafeData = await gnosisSafeContract.interface.encodeFunctionData('setup',
    [
      owners,
      threshold,
      ethers.constants.AddressZero,
      "0x",
      ethers.constants.AddressZero,
      ethers.constants.AddressZero,
      0,
      ethers.constants.AddressZero
    ]
  )
  let creationNonce = new Date().getTime()
  console.log("    Creation Nonce: ", creationNonce)

  let estimate = ((await gnosisSafeProxyFactoryContract.estimateGas.createProxyWithNonce(gnosisSafeAddress, gnosisSafeData, creationNonce)).mul(gasPrice)).add(14000)
  let creationData = await getCreationData(gnosisSafeContract, gnosisSafeProxyFactoryContract, owners, ethers.constants.AddressZero, estimate, creationNonce, config)

  // User funds safe
  let sendingTx = await wallet.sendTransaction({ to: creationData.safe, value: creationData.userCosts, gasPrice: gasPrice})
  await sendingTx.wait()

  // Weird hack for confirming previous transfer
  sendingTx = await wallet.sendTransaction({ to: creationData.safe, value: ethers.utils.parseUnits('1', 'gwei'), gasPrice: gasPrice})
  await sendingTx.wait()

  const futureSafeBalance = await provider.getBalance(creationData.safe)
  console.log("    Safe balance: ", futureSafeBalance.toString())

  await deployWithCreationData(gnosisSafeProxyFactoryContract, creationData, config)
}
