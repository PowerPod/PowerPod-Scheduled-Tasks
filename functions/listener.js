import Web3 from 'web3'
import axios from 'axios'
import dotenv from 'dotenv'

import PaymentContractABI from '../ABI/PaymentContractABI.js'

import {
  getLastProcessedBlock,
  updateLastProcessedBlock,
  recordBill,
} from '../firebase/firestore.js'

dotenv.config()

const web3 = new Web3(process.env.NODE_URL)

const contractAddress = process.env.CONTRACT_ADDRESS
const paymentContract = new web3.eth.Contract(
  PaymentContractABI,
  contractAddress
)

function formatTokenAmount(amount) {
  return (
    (BigInt(amount) / BigInt(1e6)).toString() +
    '.' +
    (BigInt(amount) % BigInt(1e6)).toString().padStart(6, '0')
  )
}

async function handleEvent(event) {
  const { blockNumber, transactionHash } = event
  const { receiver, billId, amount, pt } = event.returnValues
  console.log(
    `Block: ${blockNumber}, Tx: ${transactionHash}, Receive: ${receiver}, Bill ID: ${billId}, Amount: ${formatTokenAmount(
      amount
    )}`
  )

  const block = await web3.eth.getBlock(blockNumber)
  const blockTimestamp = block.timestamp

  try {
    const response = await axios.put(
      `${process.env.CLOUD_RUN_URL}/api/transactions/${billId}`,
      {
        amount: formatTokenAmount(amount),
        payStatus: 'success',
        payTime: blockTimestamp.toString(),
        receiver: receiver.toString(),
        txHash: transactionHash.toString(),
        sharedUserAward: pt.toString(),
        chargeUserAward: pt.toString(),
      }
    )
    console.log('Server Response:', response.data)

    // if response message is fail
    if (response.data.code === '1') {
      console.error('Error updating server:', response.data)
    }

    await recordBill(
      billId.toString(),
      amount,
      receiver.toString(),
      pt.toString(),
      blockNumber,
      transactionHash.toString(),
      response.data.code,
      response.data.message
    )
    await updateLastProcessedBlock(blockNumber)
  } catch (error) {
    console.error('Listener Error:', error)
  }
}

async function setupListeners() {
  const fromBlock = await getLastProcessedBlock()
  console.log('Last processed block:', fromBlock)

  const subscription = paymentContract.events.PaymentReceived({
    fromBlock: fromBlock,
  })

  subscription.on('data', handleEvent)

  console.log('Listening for BillPaid events...')
}

setupListeners()
