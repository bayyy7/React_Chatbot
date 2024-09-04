import 'react-native-get-random-values';
import { MongoDBAtlasVectorSearch } from '@langchain/mongodb';
import { CohereEmbeddings } from '@langchain/cohere';
import { createRetrieverTool } from 'langchain/tools/retriever';
import { RunnableWithMessageHistory } from "@langchain/core/runnables";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { HarmCategory, HarmBlockThreshold } from "@google/generative-ai";
import { createStructuredChatAgent, AgentExecutor } from "langchain/agents";
import chatPrompt from "./agent_prompt";
import connectDB from '../../mongoDB/mongodb_client';
import chatHistory from '../chat_memory/mongodb_chatMemory';


async function retrieval(){
    const client = await connectDB();
    const docs = client.db('psychologists_list').collection('list');
    const vector_store = new MongoDBAtlasVectorSearch(
        new CohereEmbeddings({
            apiKey: process.env.COHERE_API_KEY,
            model: 'embed-multilingual-v3.0',
            inputType: 'search_query',
        }),
        {
            docs,
            indexName: 'default',
            textKey: 'text',
            embeddingKey: 'text',
        }
    );
    const retriever = vector_store.asRetriever({
        searchType: "mmr", // Maximal Marginal Relevance
        searchKwargs: {
            fetchK: 20,
            lambda: 0.1,
        }
    });
    
    return retriever;
}

async function createAgent() {
    const retriever = await retrieval();
    const retrieverTool = [createRetrieverTool(
        retriever, {
            name: "psychology_search",
            description: "Gunakan tool ini ketika ada pertanyaan seputar pencarian psikologi terdekat",
        }
    )];
    const model = new ChatGoogleGenerativeAI({
        modelName: "gemini-pro",
        apiKey: process.env.GEMINI_API_KEY,
        temperature: 0.8,
        topP: 0.6,
        topK: 1,
        maxOutputTokens: 1024,
        safetySettings: [
        {
            category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
            threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
        {
            category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
            threshold: HarmBlockThreshold.BLOCK_LOW_AND_ABOVE,
        },
        ],
    });
    const agent = await createStructuredChatAgent({
        llm: model,
        prompt: chatPrompt,
        tools: retrieverTool,
    });
    const agentExecutor = new AgentExecutor({ 
        agent: agent, 
        tools: retrieverTool,
    });

    return agentExecutor;
}

async function createRunnable(newMessage, collection, sessionID) {
    const agentExecutor = await createAgent();
    const history = await chatHistory(collection, sessionID);
    const chainWithHistory = new RunnableWithMessageHistory({
        runnable: agentExecutor,
        getMessageHistory: (_sessionId) => history.getMessages(),
        inputMessagesKey: "input",
        historyMessagesKey: "chat_history",
    });
    const result = await chainWithHistory.invoke({
        input: newMessage,
    },
    {
        configurable: {
            sessionId: sessionID,
        },
    });
    history.addUserMessage(newMessage);
    history.addAIMessage(result.output);

    return result;
}

export default createRunnable;