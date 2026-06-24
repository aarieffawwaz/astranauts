import database from "../config/database.js";
import { generateEmbedding } from "../config/ollama.js";
import logger from "../middleware/logger.js";

class KnowledgeBase {
    /**
     * Add document to knowledge base
     */
    static async addDocument(content, metadata = {}, source = null, chunkIndex = 0) {
        try {
            // ✅ Generate embedding pakai Ollama API langsung
            const embedding = await generateEmbedding(content);

            const query = `
                INSERT INTO knowledge_base (content, metadata, source, chunk_index, embedding)
                VALUES ($1, $2, $3, $4, $5::vector)
                RETURNING id, source, chunk_index, created_at
            `;

            const params = [content, JSON.stringify(metadata), source, chunkIndex, `[${embedding.join(",")}]`];

            const result = await database.query(query, params);
            return result.rows[0];
        } catch (error) {
            logger.error("Failed to add document:", error);
            throw error;
        }
    }

    /**
     * Search similar documents
     */
    static async searchSimilar(query, topK = 3) {
        try {
            // ✅ Generate query embedding pakai Ollama API langsung
            const queryEmbedding = await generateEmbedding(query);

            const sql = `
                SELECT 
                    id,
                    content,
                    metadata,
                    source,
                    chunk_index,
                    1 - (embedding <=> $1::vector) as similarity
                FROM knowledge_base
                ORDER BY embedding <=> $1::vector
                LIMIT $2
            `;

            const result = await database.query(sql, [`[${queryEmbedding.join(",")}]`, topK]);

            return result.rows;
        } catch (error) {
            logger.error("Similarity search failed:", error);
            throw error;
        }
    }

    /**
     * Get all documents
     */
    static async getAll({ source = null, limit = 100 } = {}) {
        let query = "SELECT id, content, metadata, source, chunk_index, created_at FROM knowledge_base";
        const params = [];

        if (source) {
            query += " WHERE source = $1";
            params.push(source);
        }

        query += ` ORDER BY created_at DESC LIMIT $${params.length + 1}`;
        params.push(limit);

        const result = await database.query(query, params);
        return result.rows;
    }

    /**
     * Delete document by ID
     */
    static async delete(id) {
        const query = "DELETE FROM knowledge_base WHERE id = $1 RETURNING *";
        const result = await database.query(query, [id]);
        return result.rows[0];
    }

    /**
     * Delete documents by source
     */
    static async deleteBySource(source) {
        const query = "DELETE FROM knowledge_base WHERE source = $1 RETURNING *";
        const result = await database.query(query, [source]);
        logger.info(`Deleted ${result.rowCount} documents from source: ${source}`);
        return result.rows;
    }

    /**
     * Get statistics
     */
    static async getStatistics() {
        const query = `
            SELECT 
                COUNT(*) as total_documents,
                COUNT(DISTINCT source) as total_sources,
                array_agg(DISTINCT source) as sources
            FROM knowledge_base
        `;
        const result = await database.query(query);
        return result.rows[0];
    }

    /**
     * Clear entire knowledge base
     */
    static async clear() {
        const query = "DELETE FROM knowledge_base";
        const result = await database.query(query);
        logger.warn(`Cleared knowledge base: ${result.rowCount} documents deleted`);
        return result.rowCount;
    }
}

export default KnowledgeBase;
