import dotenv from "dotenv";
import logger from "../middleware/logger.js";

dotenv.config();

const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || "http://localhost:11434";
const LLM_MODEL = process.env.OLLAMA_LLM_MODEL || "llama3";
const EMBEDDING_MODEL = process.env.OLLAMA_EMBEDDING_MODEL || "nomic-embed-text";

/**
 * Generate completion using Ollama API directly
 */
export const generateCompletion = async (prompt, options = {}) => {
    try {
        const response = await fetch(`${OLLAMA_BASE_URL}/api/generate`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                model: options.model || LLM_MODEL,
                prompt: prompt,
                stream: false,
                options: {
                    temperature: options.temperature || 0.3,
                    top_p: options.top_p || 0.9,
                    num_predict: options.maxTokens || 2000,
                },
            }),
        });

        if (!response.ok) {
            throw new Error(`Ollama API error: ${response.statusText}`);
        }

        const data = await response.json();
        return data.response;
    } catch (error) {
        logger.error("Ollama completion failed:", error);
        throw error;
    }
};

/**
 * Generate embeddings using Ollama API directly
 */
export const generateEmbedding = async (text) => {
    try {
        const response = await fetch(`${OLLAMA_BASE_URL}/api/embeddings`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                model: EMBEDDING_MODEL,
                prompt: text,
            }),
        });

        if (!response.ok) {
            throw new Error(`Ollama API error: ${response.statusText}`);
        }

        const data = await response.json();
        return data.embedding;
    } catch (error) {
        logger.error("Ollama embedding failed:", error);
        throw error;
    }
};

/**
 * Test Ollama connection
 */
export const testOllamaConnection = async () => {
    try {
        const response = await generateCompletion('Hello, respond with "OK"');
        logger.info("✅ Ollama connected successfully");
        return true;
    } catch (error) {
        logger.error("❌ Ollama connection failed:", error.message);
        logger.info("Make sure Ollama is running and models are pulled:");
        logger.info("  ollama pull llama3");
        logger.info("  ollama pull nomic-embed-text");
        return false;
    }
};

// Backward compatibility exports
export const ollamaLLM = {
    invoke: generateCompletion,
};

export const ollamaEmbeddings = {
    embedQuery: generateEmbedding,
};

export default {
    ollamaLLM,
    ollamaEmbeddings,
    generateCompletion,
    generateEmbedding,
    testOllamaConnection,
};
