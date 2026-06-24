import RAGService from "../services/ragService.js";
import KnowledgeBase from "../models/KnowledgeBase.js";
import { asyncHandler } from "../middleware/errorHandler.js";

class RAGController {
    /**
     * Query RAG
     * POST /api/rag/query
     */
    static query = asyncHandler(async (req, res) => {
        const { question, top_k, include_realtime } = req.body;

        const result = await RAGService.query(question, top_k || 3, include_realtime !== false);

        res.json({
            success: true,
            data: result,
        });
    });

    /**
     * Ingest document
     * POST /api/rag/ingest
     */
    static ingestDocument = asyncHandler(async (req, res) => {
        const { file_path, source } = req.body;
        const result = await RAGService.ingestDocument(file_path, source);

        res.status(201).json({
            success: true,
            message: `Document ${result.file} ingested successfully`,
            data: result,
        });
    });

    /**
     * Ingest directory
     * POST /api/rag/ingest-directory
     */
    static ingestDirectory = asyncHandler(async (req, res) => {
        const { dir_path } = req.body;
        const results = await RAGService.ingestDirectory(dir_path);

        res.status(201).json({
            success: true,
            message: `Ingested ${results.length} documents`,
            data: results,
        });
    });

    /**
     * Get all knowledge base documents
     * GET /api/rag/documents
     */
    static getDocuments = asyncHandler(async (req, res) => {
        const { source, limit } = req.query;
        const documents = await KnowledgeBase.getAll({
            source,
            limit: parseInt(limit) || 100,
        });

        res.json({
            success: true,
            count: documents.length,
            data: documents,
        });
    });

    /**
     * Delete document
     * DELETE /api/rag/documents/:id
     */
    static deleteDocument = asyncHandler(async (req, res) => {
        const document = await KnowledgeBase.delete(parseInt(req.params.id));

        res.json({
            success: true,
            message: "Document deleted",
            data: document,
        });
    });

    /**
     * Get knowledge base statistics
     * GET /api/rag/statistics
     */
    static getStatistics = asyncHandler(async (req, res) => {
        const stats = await KnowledgeBase.getStatistics();
        res.json({
            success: true,
            data: stats,
        });
    });

    /**
     * Clear knowledge base
     * DELETE /api/rag/clear
     */
    static clearKnowledgeBase = asyncHandler(async (req, res) => {
        const count = await KnowledgeBase.clear();
        res.json({
            success: true,
            message: `Knowledge base cleared: ${count} documents deleted`,
        });
    });
}

export default RAGController;
