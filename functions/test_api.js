import axios from 'axios'
import dotenv from 'dotenv'

dotenv.config()

async function handleEvent() {
  try {
    const response = await axios.put(
      `${process.env.CLOUD_RUN_URL}/api/transactions/1`,
      {
        amount: '123',
        payStatus: 'success',
        payTime: '123',
        receiver: '123',
        txHash: '123',
        sharedUserAward: '123',
        chargeUserAward: 123,
      }
    )
    console.log('Server Response:', response.data)

    // if response message is fail
    if (response.data.code === '1') {
      console.error('Error updating server:', response.data)
      return
    }
  } catch (error) {
    console.error('Error contacting server:', error)
  }
}

handleEvent()
