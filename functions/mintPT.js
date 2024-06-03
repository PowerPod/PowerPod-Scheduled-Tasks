import { ethers } from 'ethers'
import dotenv from 'dotenv'
import axios from 'axios'

import {
  getAllPendingMintPTOrder,
  updateMintPTOrder,
} from '../firebase/firestore.js'

dotenv.config()

const contractAddress = '0x7BDD924e87f04354DbDAc314b4b39e839403C0c1'
const contractABI = [
  'function mint(uint256 id, address to, uint256 amount)',
  'function minted(uint256) view returns (bool)',
]

async function mintPoints(to, amount, pt_mint_id) {
  const provider = new ethers.JsonRpcProvider(process.env.NODE_URL_HTTP)
  const signer = new ethers.Wallet(process.env.PRIVATE_KEY)

  const contract = new ethers.Contract(
    contractAddress,
    contractABI,
    signer.connect(provider)
  )

  const amountInWei = ethers.parseUnits(amount, 21)

  // check if the id has already been minted
  const minted = await contract.minted(pt_mint_id)
  if (minted) {
    console.log(`Minted already: ${pt_mint_id}`)
    return true
  }

  const tx = await contract.mint(pt_mint_id, to, amountInWei)

  await updateMintPTOrder(pt_mint_id, { tx_hash: tx.hash })

  console.log(`Minted ${amount} PT to ${to} with tx hash ${tx.hash}`)
  return false
}

async function mintPT() {
  // query table pt_mint_order for all records with status = 'pending' and tx_hash = null
  const docs = await getAllPendingMintPTOrder()

  for (const row of docs) {
    const { id, address, amount } = row
    console.log(`Minting PT with ${amount} Energy to ${address} with id ${id}`)

    const success = await mintPoints(address, amount, id)

    if (success) {
      // inform the order server that the minting is successful
      const response = await axios.put(
        `${process.env.CLOUD_RUN_URL}/api/exchange-orders/${id}`,
        {
          pt: (Number(amount) * 1000).toString(),
          status: 'success',
        }
      )
      console.log('Server Response:', response.data)
      if (response.data.code === '0') {
        await updateMintPTOrder(id, { status: 'success' })
      }
    }
  }
}

mintPT()
