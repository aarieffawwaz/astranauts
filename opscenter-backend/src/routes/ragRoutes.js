import { Router } from "express";
import RAGController from "../controllers/ragController.js";
import { validateRagQuery } from "../middleware/validator.js";

const router = Router();

/**
 * @swagger
 * /api/rag/query:
 *   post:
 *     summary: Query RAG system
 *     description: Ask a question and get AI-powered answer with context from documents and real-time data
 *     tags: [RAG - AI Assistant]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - question
 *             properties:
 *               question:
 *                 type: string
 *                 example: Apa SOP jika kemiringan tebing melebihi 30°?
 *                 description: Question to ask the AI
 *                 minLength: 3
 *                 maxLength: 500
 *               top_k:
 *                 type: integer
 *                 example: 3
 *                 description: Number of relevant documents to retrieve
 *                 minimum: 1
 *                 maximum: 10
 *                 default: 3
 *               include_realtime:
 *                 type: boolean
 *                 example: true
 *                 description: Include real-time robot data in context
 *                 default: true
 *     responses:
 *       200:
 *         description: Query answered successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     answer:
 *                       type: string
 *                       example: Berdasarkan SOP PAMA Section 4.2, jika kemiringan melebihi 30°...
 *                       description: AI-generated answer
 *                     sources:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           source:
 *                             type: string
 *                             example: sop-safety.md
 *                           similarity:
 *                             type: number
 *                             format: float
 *                             example: 0.85
 *                           content:
 *                             type: string
 *                             example: Jika kemiringan tebing melebihi 30°...
 *                     context_used:
 *                       type: object
 *                       properties:
 *                         document_count:
 *                           type: integer
 *                           example: 3
 *                         has_realtime:
 *                           type: boolean
 *                           example: true
 *       400:
 *         description: Validation error
 *       500:
 *         description: Server error
 */
router.post("/query", validateRagQuery, RAGController.query);

/**
 * @swagger
 * /api/rag/ingest:
 *   post:
 *     summary: Ingest single document
 *     description: Add a document to the knowledge base for RAG
 *     tags: [RAG - AI Assistant]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - file_path
 *             properties:
 *               file_path:
 *                 type: string
 *                 example: ./docs/sop-safety.md
 *                 description: Path to the document file
 *               source:
 *                 type: string
 *                 example: SOP Keselamatan PAMA
 *                 description: Optional source name
 *     responses:
 *       201:
 *         description: Document ingested successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Document sop-safety.md ingested successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     file:
 *                       type: string
 *                       example: sop-safety.md
 *                     source:
 *                       type: string
 *                       example: SOP Keselamatan PAMA
 *                     chunks:
 *                       type: integer
 *                       example: 10
 *       400:
 *         description: File not found or invalid
 *       500:
 *         description: Server error
 */
router.post("/ingest", RAGController.ingestDocument);

/**
 * @swagger
 * /api/rag/ingest-directory:
 *   post:
 *     summary: Ingest all documents in directory
 *     description: Add all markdown and text files from a directory to the knowledge base
 *     tags: [RAG - AI Assistant]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - dir_path
 *             properties:
 *               dir_path:
 *                 type: string
 *                 example: ./docs
 *                 description: Path to the directory containing documents
 *     responses:
 *       201:
 *         description: Documents ingested successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Ingested 3 documents
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       file:
 *                         type: string
 *                       chunks:
 *                         type: integer
 *       500:
 *         description: Server error
 */
router.post("/ingest-directory", RAGController.ingestDirectory);

/**
 * @swagger
 * /api/rag/documents:
 *   get:
 *     summary: Get all documents
 *     description: Retrieve all documents in the knowledge base
 *     tags: [RAG - AI Assistant]
 *     parameters:
 *       - in: query
 *         name: source
 *         schema:
 *           type: string
 *         description: Filter by source name
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 100
 *         description: Maximum number of documents
 *     responses:
 *       200:
 *         description: Documents retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 count:
 *                   type: integer
 *                   example: 30
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       content:
 *                         type: string
 *                       metadata:
 *                         type: object
 *                       source:
 *                         type: string
 *                       chunk_index:
 *                         type: integer
 *                       created_at:
 *                         type: string
 *                         format: date-time
 *       500:
 *         description: Server error
 */
router.get("/documents", RAGController.getDocuments);

/**
 * @swagger
 * /api/rag/statistics:
 *   get:
 *     summary: Get knowledge base statistics
 *     description: Get statistics about the knowledge base
 *     tags: [RAG - AI Assistant]
 *     responses:
 *       200:
 *         description: Statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     total_documents:
 *                       type: integer
 *                       example: 30
 *                     total_sources:
 *                       type: integer
 *                       example: 3
 *                     sources:
 *                       type: array
 *                       items:
 *                         type: string
 *                         example: sop-safety.md
 *       500:
 *         description: Server error
 */
router.get("/statistics", RAGController.getStatistics);

/**
 * @swagger
 * /api/rag/documents/{id}:
 *   delete:
 *     summary: Delete document
 *     description: Remove a document from the knowledge base
 *     tags: [RAG - AI Assistant]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Document ID
 *     responses:
 *       200:
 *         description: Document deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Document deleted
 *                 data:
 *                   type: object
 *       404:
 *         description: Document not found
 *       500:
 *         description: Server error
 */
router.delete("/documents/:id", RAGController.deleteDocument);

/**
 * @swagger
 * /api/rag/clear:
 *   delete:
 *     summary: Clear knowledge base
 *     description: Remove all documents from the knowledge base
 *     tags: [RAG - AI Assistant]
 *     responses:
 *       200:
 *         description: Knowledge base cleared successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Knowledge base cleared
 *       500:
 *         description: Server error
 */
router.delete("/clear", RAGController.clearKnowledgeBase);

export default router;
