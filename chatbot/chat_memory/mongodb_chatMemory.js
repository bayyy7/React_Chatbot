import { MongoDBChatMessageHistory } from "@langchain/mongodb";
import connectDB from "../../mongoDB/mongodb_client";

async function chatHistory(collection, sessionID){
    const client = await connectDB(process.env.MONGODB_URI);
    const history = new MongoDBChatMessageHistory({
        collection: client.db("chat_history").collection(collection),
        sessionId: sessionID,
    });

    return history;
}

export default chatHistory;