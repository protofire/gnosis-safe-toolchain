const hardhat = require('hardhat')
const { expect } = require('chai')

const SafeToolchain = require('../index')

const { SENTINEL_OWNERS } = require('../src/util/constants')

const { PKS } = require('./utils')

const { ethers } = hardhat
const { provider } = ethers

let vegeta
let kakaroto
let karpincho
let popono

let vegetaToolchain
let kakarotoToolchain
let karpinchoToolchain
let safeAddress

describe('Admin', () => {
  before(async () => {
    ;[vegeta, kakaroto, karpincho, popono] = await ethers.getSigners()

    vegetaToolchain = SafeToolchain({
      provider,
      walletPk: PKS[0],
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

    karpinchoToolchain = SafeToolchain({
      provider,
      walletPk: PKS[2],
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

    it('Should throw when using SENTINEL_OWNERS for owner', async () => {
      try {
        await vegetaToolchain.admin.addOwnerWithThreshold(safeAddress, SENTINEL_OWNERS, 2)
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
        console.log('ERROR', error)
        expect(false).to.equal(true)
      }
    })

    it('Should approve addOwnerWithThreshold', async () => {
      try {
        const addOwnerWithThresholdTx = await vegetaToolchain.admin.addOwnerWithThreshold(
          safeAddress,
          karpincho.address,
          3
        )

        const approveTx = await addOwnerWithThresholdTx.approve()
        const {
          events: [{ event, args }],
        } = await approveTx.wait()

        expect(event).to.equal('ApproveHash')
        expect(args.approvedHash).to.equal(addOwnerWithThresholdTx.transactionHash)
        expect(args.owner).to.equal(vegeta.address)
      } catch (error) {
        console.log('ERROR', error)
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
          3
        )

        const executeTx = await addOwnerWithThresholdTx.execute([vegeta.address])

        const {
          events: [addOwner, changedThreshold, executionSuccess],
        } = await executeTx.wait()

        expect(addOwner.event).to.equal('AddedOwner')
        expect(addOwner.args.owner).to.equal(karpincho.address)

        expect(changedThreshold.event).to.equal('ChangedThreshold')
        expect(changedThreshold.args.threshold.toString()).to.equal('3')

        expect(executionSuccess.event).to.equal('ExecutionSuccess')
        expect(executionSuccess.args.txHash).to.equal(addOwnerWithThresholdTx.transactionHash)

        const owners = (await safeContract.getOwners()).map((o) => o.toLowerCase())
        expect(owners.includes(karpincho.address.toLowerCase())).to.equals(true)
      } catch (error) {
        console.log('ERROR', error)
        expect(false).to.equal(true)
      }
    })
  })
  describe('#removeOwner', () => {
    it('Should throw when using zero address for safe', async () => {
      try {
        await vegetaToolchain.admin.removeOwner(ethers.constants.AddressZero, karpincho.address, 2)
        expect(false).to.equal(true)
      } catch (error) {
        expect(error.message).to.equal('Invalid safe address')
      }
    })

    it('Should throw when using zero address for owner', async () => {
      try {
        await vegetaToolchain.admin.removeOwner(safeAddress, ethers.constants.AddressZero, 2)
        expect(false).to.equal(true)
      } catch (error) {
        expect(error.message).to.equal('Invalid owner')
      }
    })

    it('Should throw when using SENTINEL_OWNERS for owner', async () => {
      try {
        await vegetaToolchain.admin.removeOwner(safeAddress, SENTINEL_OWNERS, 2)
        expect(false).to.equal(true)
      } catch (error) {
        expect(error.message).to.equal('Invalid owner')
      }
    })

    it('Should throw when owner not included', async () => {
      try {
        await vegetaToolchain.admin.removeOwner(safeAddress, popono.address, 2)
        expect(false).to.equal(true)
      } catch (error) {
        expect(error.message).to.equal('Not an owner')
      }
    })

    it('Should throw when Threshold is defined as 0', async () => {
      try {
        await vegetaToolchain.admin.removeOwner(safeAddress, kakaroto.address, 0)
        expect(false).to.equal(true)
      } catch (error) {
        expect(error.message).to.equal('Threshold needs to be greater than 0')
      }
    })

    it('Should throw when Threshold is defined greater than owners', async () => {
      try {
        await vegetaToolchain.admin.removeOwner(safeAddress, kakaroto.address, 3)
        expect(false).to.equal(true)
      } catch (error) {
        expect(error.message).to.equal('New owner count needs to be larger than new threshold')
      }
    })

    it('Should throw when Threshold not defined and current is greater than owners', async () => {
      try {
        await vegetaToolchain.admin.removeOwner(safeAddress, kakaroto.address)
        expect(false).to.equal(true)
      } catch (error) {
        expect(error.message).to.equal('New owner count needs to be larger than new threshold')
      }
    })

    it('Should not throw when params are ok', async () => {
      try {
        await vegetaToolchain.admin.removeOwner(safeAddress, kakaroto.address, 1)
        expect(true).to.equal(true)
      } catch (error) {
        expect(false).to.equal(true)
      }
    })

    it('Should approve removeOwner by vegeta', async () => {
      try {
        const removeOwnerdTx = await vegetaToolchain.admin.removeOwner(
          safeAddress,
          kakaroto.address,
          1
        )

        const approveTx = await removeOwnerdTx.approve()
        const {
          events: [{ event, args }],
        } = await approveTx.wait()

        expect(event).to.equal('ApproveHash')
        expect(args.approvedHash).to.equal(removeOwnerdTx.transactionHash)
        expect(args.owner).to.equal(vegeta.address)
      } catch (error) {
        expect(false).to.equal(true)
      }
    })

    it('Should approve removeOwner by karpincho', async () => {
      try {
        const removeOwnerdTx = await karpinchoToolchain.admin.removeOwner(
          safeAddress,
          kakaroto.address,
          1
        )

        const approveTx = await removeOwnerdTx.approve()
        const {
          events: [{ event, args }],
        } = await approveTx.wait()

        expect(event).to.equal('ApproveHash')
        expect(args.approvedHash).to.equal(removeOwnerdTx.transactionHash)
        expect(args.owner).to.equal(karpincho.address)
      } catch (error) {
        expect(false).to.equal(true)
      }
    })

    it('Should approve removeOwner by kakaroto', async () => {
      try {
        const removeOwnerdTx = await kakarotoToolchain.admin.removeOwner(
          safeAddress,
          kakaroto.address,
          1
        )

        const approveTx = await removeOwnerdTx.approve()
        const {
          events: [{ event, args }],
        } = await approveTx.wait()

        expect(event).to.equal('ApproveHash')
        expect(args.approvedHash).to.equal(removeOwnerdTx.transactionHash)
        expect(args.owner).to.equal(kakaroto.address)
      } catch (error) {
        expect(false).to.equal(true)
      }
    })

    it('Should execute removeOwner', async () => {
      try {
        const {
          contracts: { gnosisSafeAbi },
        } = kakarotoToolchain.config
        const safeContract = new ethers.Contract(safeAddress, gnosisSafeAbi, provider)
        const ownersBefore = (await safeContract.getOwners()).map((o) => o.toLowerCase())

        expect(ownersBefore.includes(kakaroto.address.toLowerCase())).to.equals(true)

        const removeOwnerTx = await kakarotoToolchain.admin.removeOwner(
          safeAddress,
          kakaroto.address,
          1
        )

        const executeTx = await removeOwnerTx.execute([
          vegeta.address,
          kakaroto.address,
          karpincho.address,
        ])
        const {
          events: [removeOwner, changedThreshold, executionSuccess],
        } = await executeTx.wait()

        expect(removeOwner.event).to.equal('RemovedOwner')
        expect(removeOwner.args.owner).to.equal(kakaroto.address)

        expect(changedThreshold.event).to.equal('ChangedThreshold')
        expect(changedThreshold.args.threshold.toString()).to.equal('1')

        expect(executionSuccess.event).to.equal('ExecutionSuccess')
        expect(executionSuccess.args.txHash).to.equal(removeOwnerTx.transactionHash)

        const owners = (await safeContract.getOwners()).map((o) => o.toLowerCase())
        expect(owners.includes(kakaroto.address.toLowerCase())).to.equals(false)
      } catch (error) {
        console.log('ERROR', error)
        expect(false).to.equal(true)
      }
    })
  })
})
