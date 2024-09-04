import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { HarmCategory, HarmBlockThreshold } from "@google/generative-ai";
import { ConversationChain } from "langchain/chains";
import { BufferMemory } from "langchain/memory";
import chatPrompt from "./chain_prompt";
import chatHistory from "../chat_memory/mongodb_chatMemory";
import { HumanMessage, AIMessage } from "@langchain/core/messages";

async function chain(newMessage, collection, sessionID){
    const history = await chatHistory(collection, sessionID);
    const memory = new BufferMemory({
        chatHistory: history.getMessages(),
        inputKey: 'input',
        aiPrefix: 'AI',
        humanPrefix: 'Human',
        returnMessages: true,
    });
    const model = new ChatGoogleGenerativeAI({
        modelName: 'gemini-pro',
        apiKey: process.env.GEMINI_API_KEY,
        temperature: 0.8,
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
    const llmChain = new ConversationChain({
        llm: model,
        prompt: chatPrompt,
        memory: memory,
    });
    const result = await llmChain.invoke({ input: newMessage });

    history.addUserMessage(newMessage);
    history.addAIMessage(result['response']);
    //history.addMessage(new HumanMessage(newMessage));
    //history.addMessage(new AIMessage(result['response']));

    return result;
}


export default chain;