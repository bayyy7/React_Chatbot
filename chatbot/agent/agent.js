import 'react-native-get-random-values';
import { ChatMessageHistory } from "langchain/memory";
import { RunnableWithMessageHistory } from "@langchain/core/runnables";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { HarmCategory, HarmBlockThreshold } from "@google/generative-ai";
import { ChatPromptTemplate, PromptTemplate } from "@langchain/core/prompts";
import { createStructuredChatAgent, AgentExecutor } from "langchain/agents";
import { TavilySearchResults } from "@langchain/community/tools/tavily_search";
import { pull } from "langchain/hub";
import chatPrompt from "./agent_prompt";
import apiKeys from '../../api_services';

const {Gemini, Tavily, Langchain_hub} = apiKeys;

const model = new ChatGoogleGenerativeAI({
    modelName: "gemini-pro",
    apiKey: Gemini,
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

async function createAgent() {
    const prompt = await pull<ChatPromptTemplate>({
        ownerRepoCommit: "hwchase17/structured-chat-agent",
        apiKey: Langchain_hub
    });
    const searchTool = [new TavilySearchResults({
        apiKey: Tavily, 
        maxResults:5,
    })];
    const agent = await createStructuredChatAgent({
        llm: model,
        prompt: chatPrompt,
        tools: searchTool,
    });
    const agentExecutor = new AgentExecutor({ 
        agent: agent, 
        tools: searchTool,
    });
    return agentExecutor;
}

async function createRunnable() {
    const agentExecutor = await createAgent();
    const messageHistory = new ChatMessageHistory();
    
    const chainWithHistory = new RunnableWithMessageHistory({
        runnable: agentExecutor,
        getMessageHistory: (_sessionId) => messageHistory,
        inputMessagesKey: "input",
        historyMessagesKey: "chat_history",
    });
    return chainWithHistory;
}

async function myFunction(newMessage, sessionId) {
    const runnable = await createRunnable();
    const result = await runnable.invoke({
        input: newMessage,
    },
    {
        configurable: {
            sessionId: sessionId,
        },
    });
    return result;
}

export default myFunction;