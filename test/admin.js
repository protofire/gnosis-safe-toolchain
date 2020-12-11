const hardhat = require('hardhat')
const { expect } = require('chai')

const SafeToolchain = require('../index')

const { PKS } = require('./utils')

const { ethers } = hardhat
const { provider } = ethers

let vegeta
let kakaroto
let karpincho

let vegetaToolchain
let kakarotoToolchain
let safeAddress

describe('Admin', () => {
  before(async () => {
    ;[vegeta, kakaroto, karpincho] = await ethers.getSigners()

    vegetaToolchain = SafeToolchain({
      provider,
      walletPk: PKS[0],
      owners: [vegeta.address, kakaroto.address, karpincho.address],
      threshold: 1,
      gasPrice: '30',
      networkType: 'ethereum',
      networkId: 5,
    })

    kakarotoToolchain = SafeToolchain({
      provider,
      walletPk: PKS[1],
      gasPrice: '30',
      networkType: 'ethereum',
      networkId: 5,
    })

    safeAddress = await vegetaToolchain.commands.deploy([vegeta.address, kakaroto.address], 1)

    const transferTs = await vegetaToolchain.config.wallet.sendTransaction({
      to: safeAddress,
      value: ethers.utils.parseUnits('5'),
    })
    await transferTs.wait()
  })

  describe('#addOwnerWithThreshold', () => {
    it('Should throw when using zero address for safe', async () => {
      try {
        await vegetaToolchain.admin.addOwnerWithThreshold(
          ethers.constants.AddressZero,
          karpincho.address,
          2
        )
        expect(false).to.equal(true)
      } catch (error) {
        expect(error.message).to.equal('Invalid safe address')
      }
    })

    it('Should throw when using zero address for owner', async () => {
      try {
        await vegetaToolchain.admin.addOwnerWithThreshold(
          safeAddress,
          ethers.constants.AddressZero,
          2
        )
        expect(false).to.equal(true)
      } catch (error) {
        expect(error.message).to.equal('Invalid owner')
      }
    })

    it('Should throw when owner is already included', async () => {
      try {
        await vegetaToolchain.admin.addOwnerWithThreshold(safeAddress, kakaroto.address, 2)
        expect(false).to.equal(true)
      } catch (error) {
        expect(error.message).to.equal('Address is already an owner')
      }
    })

    it('Should throw when Threshold is defined as 0', async () => {
      try {
        await vegetaToolchain.admin.addOwnerWithThreshold(safeAddress, karpincho.address, 0)
        expect(false).to.equal(true)
      } catch (error) {
        expect(error.message).to.equal('Threshold needs to be greater than 0')
      }
    })

    it('Should throw when Threshold is gt owners length', async () => {
      try {
        await vegetaToolchain.admin.addOwnerWithThreshold(safeAddress, karpincho.address, 4)
        expect(false).to.equal(true)
      } catch (error) {
        expect(error.message).to.equal('Threshold cannot exceed owner count')
      }
    })

    it('Should not throw when params are ok', async () => {
      try {
        await vegetaToolchain.admin.addOwnerWithThreshold(safeAddress, karpincho.address, 2)
        expect(true).to.equal(true)
      } catch (error) {
        expect(false).to.equal(true)
      }
    })

    it('Should approve addOwnerWithThreshold', async () => {
      try {
        const addOwnerWithThresholdTx = await vegetaToolchain.admin.addOwnerWithThreshold(
          safeAddress,
          karpincho.address,
          2
        )

        const approveTx = await addOwnerWithThresholdTx.approve()
        const {
          events: [{ event, args }],
        } = await approveTx.wait()

        expect(event).to.equal('ApproveHash')
        expect(args.approvedHash).to.equal(addOwnerWithThresholdTx.transactionHash)
        expect(args.owner).to.equal(vegeta.address)
      } catch (error) {
        expect(false).to.equal(true)
      }
    })

    it('Should execute addOwnerWithThreshold', async () => {
      try {
        const {
          contracts: { gnosisSafeAbi },
        } = kakarotoToolchain.config
        const safeContract = new ethers.Contract(safeAddress, gnosisSafeAbi, provider)
        const ownersBefore = (await safeContract.getOwners()).map((o) => o.toLowerCase())
        expect(ownersBefore.includes(karpincho.address.toLowerCase())).to.equals(false)

        const addOwnerWithThresholdTx = await kakarotoToolchain.admin.addOwnerWithThreshold(
          safeAddress,
          karpincho.address,
          2
        )

        const executeTx = await addOwnerWithThresholdTx.execute([vegeta.address])

        const {
          events: [addOwner, changedThreshold, executionSuccess],
        } = await executeTx.wait()

        expect(addOwner.event).to.equal('AddedOwner')
        expect(addOwner.args.owner).to.equal(karpincho.address)

        expect(changedThreshold.event).to.equal('ChangedThreshold')
        expect(changedThreshold.args.threshold.toString()).to.equal('2')

        expect(executionSuccess.event).to.equal('ExecutionSuccess')
        expect(executionSuccess.args.txHash).to.equal(addOwnerWithThresholdTx.transactionHash)

        const owners = (await safeContract.getOwners()).map((o) => o.toLowerCase())
        expect(owners.includes(karpincho.address.toLowerCase())).to.equals(true)
      } catch (error) {
        console.log(error)
        expect(false).to.equal(true)
      }
    })
  })
})
