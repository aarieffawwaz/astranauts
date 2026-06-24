import { ollamaLLM } from "../config/ollama.js";
import KnowledgeBase from "../models/KnowledgeBase.js";
import Telemetry from "../models/Telemetry.js";
import Robot from "../models/Robot.js";
import logger from "../middleware/logger.js";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import fs from "fs/promises";
import path from "path";

class RAGService {
    /**
     * Query with RAG
     */
    static async query(question, topK = 3, includeRealtimeContext = true) {
        try {
            logger.info(`RAG Query: "${question}"`);

            // 1. Retrieve relevant documents
            const relevantDocs = await KnowledgeBase.searchSimilar(question, topK);

            // 2. Build context from retrieved documents
            let contextText = relevantDocs.map((doc, idx) => `Document ${idx + 1} (Source: ${doc.source}, Similarity: ${(doc.similarity * 100).toFixed(1)}%):\n${doc.content}`).join("\n\n---\n\n");

            // 3. Add real-time context if requested
            let realtimeContext = "";
            if (includeRealtimeContext) {
                realtimeContext = await this.getRealtimeContext();
            }

            // 4. Build final prompt
            const prompt = this.buildPrompt(question, contextText, realtimeContext);

            // 5. Generate response
            const response = await ollamaLLM.invoke(prompt);

            return {
                answer: response,
                sources: relevantDocs.map((doc) => ({
                    source: doc.source,
                    similarity: doc.similarity,
                    content: doc.content.substring(0, 200) + "...",
                })),
                context_used: {
                    document_count: relevantDocs.length,
                    has_realtime: includeRealtimeContext,
                },
            };
        } catch (error) {
            logger.error("RAG query failed:", error);
            throw error;
        }
    }

    /**
     * Get real-time context from robots
     */
    static async getRealtimeContext() {
        try {
            const robots = await Robot.findAll({ limit: 10 });
            const latestTelemetry = await Telemetry.getAllLatest();

            let context = "\n=== KONDISI ARMADA REAL-TIME ===\n";

            for (const robot of robots) {
                const telemetry = latestTelemetry.find((t) => t.robot_id === robot.id);
                context += `\nRobot ${robot.name} (${robot.status}):\n`;
                context += `  - Battery: ${robot.battery_level}%\n`;

                if (telemetry) {
                    context += `  - Speed: ${telemetry.speed} cm/s\n`;
                    context += `  - Position: (${telemetry.x_position.toFixed(2)}, ${telemetry.y_position.toFixed(2)})\n`;
                    if (telemetry.distance_to_obstacle !== null) {
                        context += `  - Distance to obstacle: ${telemetry.distance_to_obstacle} cm\n`;
                    }
                    if (telemetry.tilt_angle !== null) {
                        context += `  - Tilt angle: ${telemetry.tilt_angle}°\n`;
                    }
                }
            }

            return context;
        } catch (error) {
            logger.error("Failed to get realtime context:", error);
            return "";
        }
    }

    /**
     * Build prompt for LLM
     */
    static buildPrompt(question, documentContext, realtimeContext) {
        return `Kamu adalah AI Assistant untuk Remote Operation Center (ROC) di perusahaan tambang PT Pamapersada Nusantara (PAMA).

=== DOKUMENTASI PAMA ===
${documentContext || "Tidak ada dokumen relevan yang ditemukan."}

${realtimeContext}

=== PERTANYAAN ===
${question}

=== INSTRUKSI ===
1. Jawab pertanyaan berdasarkan dokumentasi di atas.
2. Jika ada data real-time yang relevan, sertakan dalam jawaban.
3. Jawab dalam Bahasa Indonesia yang profesional.
4. Berikan jawaban yang singkat, jelas, dan actionable.
5. Jika informasi tidak tersedia di dokumentasi, katakan dengan jujur.
6. Selalu prioritaskan keselamatan dalam setiap rekomendasi.

Jawaban:`;
    }

    /**
     * Ingest document to knowledge base
     */
    static async ingestDocument(filePath, source = null) {
        try {
            const content = await fs.readFile(filePath, "utf-8");
            const fileName = path.basename(filePath);
            const docSource = source || fileName;

            // Split into chunks
            const splitter = new RecursiveCharacterTextSplitter({
                chunkSize: parseInt(process.env.RAG_CHUNK_SIZE) || 500,
                chunkOverlap: parseInt(process.env.RAG_CHUNK_OVERLAP) || 50,
            });

            const chunks = await splitter.splitText(content);
            logger.info(`Split ${fileName} into ${chunks.length} chunks`);

            // Add each chunk to knowledge base
            const results = [];
            for (let i = 0; i < chunks.length; i++) {
                const result = await KnowledgeBase.addDocument(chunks[i], { file: fileName, chunk_index: i, total_chunks: chunks.length }, docSource, i);
                results.push(result);
            }

            logger.info(`✅ Ingested ${fileName} (${chunks.length} chunks)`);
            return {
                file: fileName,
                source: docSource,
                chunks: chunks.length,
                results,
            };
        } catch (error) {
            logger.error(`Failed to ingest ${filePath}:`, error);
            throw error;
        }
    }

    /**
     * Ingest all documents from a directory
     */
    static async ingestDirectory(dirPath) {
        try {
            const files = await fs.readdir(dirPath);
            const results = [];

            for (const file of files) {
                if (file.endsWith(".md") || file.endsWith(".txt")) {
                    const filePath = path.join(dirPath, file);
                    const result = await this.ingestDocument(filePath);
                    results.push(result);
                }
            }

            return results;
        } catch (error) {
            logger.error(`Failed to ingest directory ${dirPath}:`, error);
            throw error;
        }
    }
}

export default RAGService;
