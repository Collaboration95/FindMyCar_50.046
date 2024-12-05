import { MongoClient } from 'mongodb';
export const handler = async (event) => {

  const uri = process.env.MONGODB_URI; 
  const collectionName = process.env.COLLECTION_NAME;
  const dbName = process.env.DB_NAME;
  
  let client;
  
  try {
    let payload = event;

    if (payload.payload) {
      payload = JSON.parse(payload.payload.toString()); // Parse IoT Core payload
  } else if (typeof payload === 'string') {
      payload = JSON.parse(payload);
  } else if (payload.body) {
      payload = JSON.parse(payload.body);
  }

  client = await MongoClient.connect(uri);

  const db = client.db(dbName);
  const collection = db.collection(collectionName);

    // Insert the data
  await collection.insertOne(payload);

  return {
    statusCode: 200,
    body: JSON.stringify('Data stored successfully.')
  }
  } catch (error){
    console.error("Error processing messages :",error);
    return {
      statusCode: 500,
      body: JSON.stringify('Error processing message.')
  };
  } finally {
    if (client) {
      await client.close();
    }
  }
};
