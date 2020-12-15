const hardhat = require('hardhat')
const { expect } = require('chai')

const SafeToolchain = require('../index')
const { getCreationData } = require('../src/commands/deploy')

const { deployContract } = hardhat.waffle
const { ethers } = hardhat
const { provider } = ethers

let vegeta
let kakaroto
let karpincho

let vegetaToolchain
let kakarotoToolchain
let karpinchoToolchain
let safeAddress

const pks = [
  '0x4f3edf983ac636a65a842ce7c78d9aa706d3b113bce9c46f30d7d21715b23b1d',
  '0x6cbed15c793ce57650b9877cf6fa156fbef513c4e6134f022a85b1ffdd59b2a1',
  '0x6370fd033278c143179d81c5526140625662b8daa446c22ee2d73db3707e620c',
]

const Test = require('../artifacts/contracts/Test.sol/Test.json')

let testContract
let encodedFunctionData

describe('Commands', () => {
  before(async () => {
    ;[vegeta, kakaroto, karpincho] = await ethers.getSigners()

    testContract = await deployContract(vegeta, Test, [])
    encodedFunctionData = testContract.interface.encodeFunctionData('add', [])

    vegetaToolchain = SafeToolchain({
      provider,
      walletPk: pks[0],
      gasPrice: '30',
      networkType: 'ethereum',
      networkId: 5,
    })
  })

  it('Should deploy a Safe', async () => {
    const creationNonce = new Date().getTime()
    const data = await getCreationData(vegetaToolchain.config)(
      [vegeta.address, kakaroto.address, karpincho.address],
      2,
      creationNonce
    )

    const codeBefore = await provider.getCode(data.safe)
    expect(codeBefore).to.equal('0x')

    safeAddress = await vegetaToolchain.commands.deploy(
      [vegeta.address, kakaroto.address, karpincho.address],
      2,
      data.creationNonce
    )

    expect(safeAddress.toLowerCase()).to.equal(data.safe.toLowerCase())

    const codeAfter = await provider.getCode(data.safe)
    expect(codeAfter).to.not.equal('0x')
  })

  it('Should approve a transaction hash by its owners', async () => {
    const { transactionHash } = await vegetaToolchain.commands.transactionData(safeAddress, {
      to: testContract.address,
      value: '0',
      data: encodedFunctionData,
      operation: 0, // CALL
    })

    const vegetaApproveTx = await vegetaToolchain.commands.approveHash(safeAddress, transactionHash)
    const {
      events: [{ event: vegetaEvent, args: vegetaArgs }],
    } = await vegetaApproveTx.wait()

    expect(vegetaEvent).to.equal('ApproveHash')
    expect(vegetaArgs.approvedHash).to.equal(transactionHash)
    expect(vegetaArgs.owner).to.equal(vegeta.address)

    kakarotoToolchain = SafeToolchain({
      provider,
      walletPk: pks[1],
      gasPrice: '30',
      networkType: 'ethereum',
      networkId: 5,
    })

    const kakarotoApproveTx = await kakarotoToolchain.commands.approveHash(
      safeAddress,
      transactionHash
    )
    const {
      events: [{ event: kakarotoEvent, args: kakarotoArgs }],
    } = await kakarotoApproveTx.wait()

    expect(kakarotoEvent).to.equal('ApproveHash')
    expect(kakarotoArgs.approvedHash).to.equal(transactionHash)
    expect(kakarotoArgs.owner).to.equal(kakaroto.address)
  })

  it('Should execute a transaction approved by orwners threshold', async () => {
    const counterBefore = await testContract.counter()

    const { transactionHash, txData } = await vegetaToolchain.commands.transactionData(
      safeAddress,
      {
        to: testContract.address,
        value: '0',
        data: encodedFunctionData,
        operation: 0, // CALL
      }
    )

    karpinchoToolchain = SafeToolchain({
      provider,
      walletPk: pks[2],
      gasPrice: '20000000000',
      networkType: 'ethereum',
      networkId: 5,
    })

    const executeTx = await karpinchoToolchain.commands.executeTransaction(safeAddress, {
      ...txData,
      approvers: [vegeta.address, kakaroto.address],
    })

    const {
      events: [{ event, args }],
    } = await executeTx.wait()

    expect(event).to.equal('ExecutionSuccess')
    expect(args.txHash).to.equal(transactionHash)

    const counter = await testContract.counter()
    expect(counter).to.equal(counterBefore.add(1))
  })
})
