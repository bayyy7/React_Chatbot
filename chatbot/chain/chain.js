import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { HarmCategory, HarmBlockThreshold } from "@google/generative-ai";
import { ConversationChain } from "langchain/chains";
import { BufferMemory } from "langchain/memory";
import chatPrompt from "./chain_prompt";

const model = new ChatGoogleGenerativeAI({
    modelName: "gemini-pro",
    apiKey: process.env.GEMINI_API_KEY,
    temperature: 0.9,
    topP: 0.6,
    topK: 1,
    maxOutputTokens: 756,
    safetySettings: [{
        category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE
    },
    {
        category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
        threshold: HarmBlockThreshold.BLOCK_LOW_AND_ABOVE
    }]
});

const memory = new BufferMemory({
    memoryKey: 'chat_history',
    inputKey: 'input',
    returnMessages: true,
    aiPrefix: "AI",
    humanPrefix: "Human",
});

const llmChain = new ConversationChain({
    llm: model,
    prompt: chatPrompt,
    memory: memory,
});


export default llmChain;