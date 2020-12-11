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

    it('Should throw when using non address for safe', async () => {
      try {
        await vegetaToolchain.admin.addOwnerWithThreshold('invalid address', karpincho.address, 2)
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

    it('Should throw when using invalid address for owner', async () => {
      try {
        await vegetaToolchain.admin.addOwnerWithThreshold(safeAddress, 'invalid address', 2)
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

    it('Should throw when using invalid address for safe', async () => {
      try {
        await vegetaToolchain.admin.removeOwner('invalid address', karpincho.address, 2)
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

    it('Should throw when using invalid address for owner', async () => {
      try {
        await vegetaToolchain.admin.removeOwner(safeAddress, 'invalid address', 2)
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
  describe('#swapOwner', () => {
    it('Should throw when using zero address for safe', async () => {
      try {
        await vegetaToolchain.admin.swapOwner(ethers.constants.AddressZero, karpincho.address, 2)
        expect(false).to.equal(true)
      } catch (error) {
        expect(error.message).to.equal('Invalid safe address')
      }
    })

    it('Should throw when using invalid address for safe', async () => {
      try {
        await vegetaToolchain.admin.swapOwner('invalid address', karpincho.address, 2)
        expect(false).to.equal(true)
      } catch (error) {
        expect(error.message).to.equal('Invalid safe address')
      }
    })

    it('Should throw when using zero address for oldOwner', async () => {
      try {
        await vegetaToolchain.admin.swapOwner(
          safeAddress,
          ethers.constants.AddressZero,
          kakaroto.address
        )
        expect(false).to.equal(true)
      } catch (error) {
        expect(error.message).to.equal('Invalid owner')
      }
    })

    it('Should throw when using invalid address for oldOwner', async () => {
      try {
        await vegetaToolchain.admin.swapOwner(safeAddress, 'invalid address', kakaroto.address)
        expect(false).to.equal(true)
      } catch (error) {
        expect(error.message).to.equal('Invalid owner')
      }
    })

    it('Should throw when using SENTINEL_OWNERS for oldOwner', async () => {
      try {
        await vegetaToolchain.admin.swapOwner(safeAddress, SENTINEL_OWNERS, kakaroto.address)
        expect(false).to.equal(true)
      } catch (error) {
        expect(error.message).to.equal('Invalid owner')
      }
    })

    it('Should throw when using zero address for newOwner', async () => {
      try {
        await vegetaToolchain.admin.swapOwner(
          safeAddress,
          karpincho.address,
          ethers.constants.AddressZero
        )
        expect(false).to.equal(true)
      } catch (error) {
        expect(error.message).to.equal('Invalid owner')
      }
    })

    it('Should throw when using invalid address for newOwner', async () => {
      try {
        await vegetaToolchain.admin.swapOwner(safeAddress, karpincho.address, 'invalid address')
        expect(false).to.equal(true)
      } catch (error) {
        expect(error.message).to.equal('Invalid owner')
      }
    })

    it('Should throw when using SENTINEL_OWNERS for newOwner', async () => {
      try {
        await vegetaToolchain.admin.swapOwner(safeAddress, karpincho.address, SENTINEL_OWNERS)
        expect(false).to.equal(true)
      } catch (error) {
        expect(error.message).to.equal('Invalid owner')
      }
    })

    it('Should throw when oldOwner not included', async () => {
      try {
        await vegetaToolchain.admin.swapOwner(safeAddress, popono.address, kakaroto.address)
        expect(false).to.equal(true)
      } catch (error) {
        expect(error.message).to.equal('Not an owner')
      }
    })

    it('Should throw when newOwner is included', async () => {
      try {
        await vegetaToolchain.admin.swapOwner(safeAddress, karpincho.address, vegeta.address)
        expect(false).to.equal(true)
      } catch (error) {
        expect(error.message).to.equal('Address is already an owner')
      }
    })

    it('Should not throw when params are ok', async () => {
      try {
        await vegetaToolchain.admin.swapOwner(safeAddress, karpincho.address, kakaroto.address)
        expect(true).to.equal(true)
      } catch (error) {
        console.log('ERROR', error)
        expect(false).to.equal(true)
      }
    })

    it('Should approve swapOwner by vegeta', async () => {
      try {
        const swapOwnerdTx = await vegetaToolchain.admin.swapOwner(
          safeAddress,
          karpincho.address,
          kakaroto.address
        )

        const approveTx = await swapOwnerdTx.approve()
        const {
          events: [{ event, args }],
        } = await approveTx.wait()

        expect(event).to.equal('ApproveHash')
        expect(args.approvedHash).to.equal(swapOwnerdTx.transactionHash)
        expect(args.owner).to.equal(vegeta.address)
      } catch (error) {
        expect(false).to.equal(true)
      }
    })

    it('Should execute swapOwner', async () => {
      try {
        const {
          contracts: { gnosisSafeAbi },
        } = kakarotoToolchain.config
        const safeContract = new ethers.Contract(safeAddress, gnosisSafeAbi, provider)
        const ownersBefore = (await safeContract.getOwners()).map((o) => o.toLowerCase())

        expect(ownersBefore.includes(kakaroto.address.toLowerCase())).to.equals(false)
        expect(ownersBefore.includes(karpincho.address.toLowerCase())).to.equals(true)

        const swapOwnerTx = await kakarotoToolchain.admin.swapOwner(
          safeAddress,
          karpincho.address,
          kakaroto.address
        )

        const executeTx = await swapOwnerTx.execute([vegeta.address])
        const {
          events: [removeOwner, addOwner, executionSuccess],
        } = await executeTx.wait()

        expect(removeOwner.event).to.equal('RemovedOwner')
        expect(removeOwner.args.owner).to.equal(karpincho.address)

        expect(addOwner.event).to.equal('AddedOwner')
        expect(addOwner.args.owner).to.equal(kakaroto.address)

        expect(executionSuccess.event).to.equal('ExecutionSuccess')
        expect(executionSuccess.args.txHash).to.equal(swapOwnerTx.transactionHash)

        const owners = (await safeContract.getOwners()).map((o) => o.toLowerCase())
        expect(owners.includes(kakaroto.address.toLowerCase())).to.equals(true)
        expect(owners.includes(karpincho.address.toLowerCase())).to.equals(false)
      } catch (error) {
        console.log('ERROR', error)
        expect(false).to.equal(true)
      }
    })
  })
  describe('#changeThreshold', () => {
    it('Should throw when using zero address for safe', async () => {
      try {
        await vegetaToolchain.admin.changeThreshold(ethers.constants.AddressZero, 1)
        expect(false).to.equal(true)
      } catch (error) {
        expect(error.message).to.equal('Invalid safe address')
      }
    })

    it('Should throw when using invalid address for safe', async () => {
      try {
        await vegetaToolchain.admin.changeThreshold('invalid address', 1)
        expect(false).to.equal(true)
      } catch (error) {
        expect(error.message).to.equal('Invalid safe address')
      }
    })

    it('Should throw when using undefined threshold', async () => {
      try {
        await vegetaToolchain.admin.changeThreshold(safeAddress)
        expect(false).to.equal(true)
      } catch (error) {
        expect(error.message).to.equal('Threshold needs to be greater than 0')
      }
    })

    it('Should throw when using 0 threshold', async () => {
      try {
        await vegetaToolchain.admin.changeThreshold(safeAddress, 0)
        expect(false).to.equal(true)
      } catch (error) {
        expect(error.message).to.equal('Threshold needs to be greater than 0')
      }
    })

    it('Should throw when gt owners', async () => {
      try {
        await vegetaToolchain.admin.changeThreshold(safeAddress, 3)
        expect(false).to.equal(true)
      } catch (error) {
        expect(error.message).to.equal('Threshold cannot exceed owner count')
      }
    })

    it('Should not throw when params are ok', async () => {
      try {
        await vegetaToolchain.admin.changeThreshold(safeAddress, 2)
        expect(true).to.equal(true)
      } catch (error) {
        console.log('ERROR', error)
        expect(false).to.equal(true)
      }
    })

    it('Should approve changeThreshold by vegeta', async () => {
      try {
        const changeThresholddTx = await vegetaToolchain.admin.changeThreshold(safeAddress, 2)

        const approveTx = await changeThresholddTx.approve()
        const {
          events: [{ event, args }],
        } = await approveTx.wait()

        expect(event).to.equal('ApproveHash')
        expect(args.approvedHash).to.equal(changeThresholddTx.transactionHash)
        expect(args.owner).to.equal(vegeta.address)
      } catch (error) {
        expect(false).to.equal(true)
      }
    })

    it('Should execute changeThreshold', async () => {
      try {
        const {
          contracts: { gnosisSafeAbi },
        } = kakarotoToolchain.config
        const safeContract = new ethers.Contract(safeAddress, gnosisSafeAbi, provider)
        const thresholdBefore = await safeContract.getThreshold()
        expect(thresholdBefore.toString()).to.equals('1')

        const changeThresholdTx = await kakarotoToolchain.admin.changeThreshold(safeAddress, 2)

        const executeTx = await changeThresholdTx.execute([vegeta.address])
        const {
          events: [change, executionSuccess],
        } = await executeTx.wait()

        expect(change.event).to.equal('ChangedThreshold')
        expect(change.args.threshold).to.equal('2')

        expect(executionSuccess.event).to.equal('ExecutionSuccess')
        expect(executionSuccess.args.txHash).to.equal(changeThresholdTx.transactionHash)

        const thresholdAfter = await safeContract.getThreshold()
        expect(thresholdAfter.toString()).to.equals('2')
      } catch (error) {
        console.log('ERROR', error)
        expect(false).to.equal(true)
      }
    })
  })
})
