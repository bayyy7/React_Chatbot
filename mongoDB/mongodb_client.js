import { MongoClient, ServerApiVersion } from "mongodb";

async function connectDB(uri){
    const client = new MongoClient(uri, {
        serverApi: {
            version: ServerApiVersion.v1,
            strict: true,
            deprecationErrors: true,
        }
    });
    try {
        await client.connect();
        return client;
    } catch (e) {
        console.error(e);
    } finally {
        await client.close();
    }
}

export default connectDB;