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
    '0x08F08E957BAA0620921d0aF539A81DcfBa2B1FA7',
    ['function add() public'],
    safe.config.wallet
  )

  const data = testContract.interface.encodeFunctionData('add',[])

  const { transactionHash, txData} = await safe.commands.transactionData(process.env.SAFE_ADDRESS, {
    to: '0x08F08E957BAA0620921d0aF539A81DcfBa2B1FA7',
    value: '0',
    data: data,
    operation: 0 // CALL
  })

  // appove
  // await safe.commands.approveHash(process.env.SAFE_ADDRESS, transactionHash)

  // execute
  let transferTs = await safe.config.wallet.sendTransaction({ to: process.env.SAFE_ADDRESS, value: ethers.utils.parseUnits('1'), gasPrice: ethers.utils.parseUnits('470', 'gwei')})
  await transferTs.wait()
  transferTs = await safe.config.wallet.sendTransaction({ to: process.env.SAFE_ADDRESS, value: ethers.utils.parseUnits('1', 'wei'), gasPrice: ethers.utils.parseUnits('470', 'gwei')})
  await transferTs.wait()

  await safe.commands.executeTransaction(
    process.env.SAFE_ADDRESS,
    {
      ...txData,
      approvers: [
        '0x602ebbd837b3B28406C290bBF5f6E2536B145aA9',
        '0x9be99c3959AC66a5d7257a99C86653bD3f228b49'
      ]
    }
  )
}

main()
  .then(() => console.log('FINISH'))
  .catch(console.log)
