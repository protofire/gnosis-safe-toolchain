require('dotenv').config()
const ethers = require('ethers')

const safe = require('./index')({
  rpcUrl: process.env.RPC_URL,
  walletPk: process.env.DEPLOYER_PK ,
  owners: ['0x3b91e1B85d35544a6F681af2ed7aDAE2Dd7CbF52','0x602ebbd837b3B28406C290bBF5f6E2536B145aA9','0x9be99c3959AC66a5d7257a99C86653bD3f228b49'],
  threshold: process.env.THRESHOLD ,
  gasPrice: process.env.GAS_PRICE ,
  networkType: process.env.NETWORK_TYPE ,
  networkId: process.env.NETWORK_ID
})

const main = async () => {
  // deploy
  // await safe.commands.deploy(['0x3b91e1B85d35544a6F681af2ed7aDAE2Dd7CbF52','0x602ebbd837b3B28406C290bBF5f6E2536B145aA9','0x9be99c3959AC66a5d7257a99C86653bD3f228b49'])

  const testContract = new ethers.Contract(
    '0x83bd616fB7F6E39279d2433b19A878142355Db0F',
    ['function add() public'],
    safe.config.wallet
  )

  const data = testContract.interface.encodeFunctionData('add',[])

  const { transactionHash, txData} = await safe.commands.transactionData('0x457957fcaed7ca9cb3cb3d7f84c6768b70474b3d', {
    to: '0x83bd616fB7F6E39279d2433b19A878142355Db0F',
    value: '0',
    data: data,
    operation: 0 // CALL
  })

  // appove
  // await safe.commands.approveHash('0x457957fcaed7ca9cb3cb3d7f84c6768b70474b3d', transactionHash)

  // execute
  // let transferTs = await safe.config.wallet.sendTransaction({ to: '0x457957fcaed7ca9cb3cb3d7f84c6768b70474b3d', value: ethers.utils.parseUnits('1'), gasPrice: ethers.utils.parseUnits('470', 'gwei')})
  // await transferTs.wait()
  // transferTs = await safe.config.wallet.sendTransaction({ to: '0x457957fcaed7ca9cb3cb3d7f84c6768b70474b3d', value: ethers.utils.parseUnits('1', 'wei'), gasPrice: ethers.utils.parseUnits('470', 'gwei')})
  // await transferTs.wait()

  await safe.commands.executeTransaction(
    '0x457957fcaed7ca9cb3cb3d7f84c6768b70474b3d',
    {
      ...txData,
      approvers: [
        '0x602ebbd837b3B28406C290bBF5f6E2536B145aA9',
        '0x3b91e1B85d35544a6F681af2ed7aDAE2Dd7CbF52'
      ]
    }
  )
}

main()
  .then(() => console.log('FINISH'))
  .catch(console.log)
