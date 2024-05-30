import admin from 'firebase-admin'

import serviceAccount from '../powerpod-project-firebase-adminsdk-86n3t-b05434e0f6.json' assert { type: 'json' }

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
})

const db = admin.firestore()

async function getLastProcessedBlock() {
  const docRef = db.collection('blocks').doc('lastProcessed')
  const doc = await docRef.get()
  if (doc.exists) {
    return doc.data().number
  } else {
    // return '5709409'
    return 'latest'
  }
}

async function updateLastProcessedBlock(blockNumber) {
  await db
    .collection('blocks')
    .doc('lastProcessed')
    .set({ number: blockNumber })
}

async function recordBill(
  billId,
  amount,
  receiver,
  pt,
  blockNumber,
  transactionHash,
  responseCode,
  responseMessage
) {
  await db.collection('billRecords').doc(billId).set({
    amount,
    receiver,
    pt,
    blockNumber,
    transactionHash,
    responseCode,
    responseMessage,
  })
}

async function getAllPendingMintPTOrder() {
  const docRef = db.collection('mint_pt_order').where('status', '==', 'pending')

  const result = await docRef.get()

  // consists doc id
  return result.docs.map((doc) => {
    return {
      id: doc.id,
      ...doc.data(),
    }
  })
}

async function updateMintPTOrder(orderId, obj) {
  await db.collection('mint_pt_order').doc(orderId).update(obj)
}

export {
  getLastProcessedBlock,
  updateLastProcessedBlock,
  recordBill,
  getAllPendingMintPTOrder,
  updateMintPTOrder,
}
