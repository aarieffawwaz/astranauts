import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import RAGService from "../src/services/ragService.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ingestDocuments = async () => {
    try {
        console.log("🔄 Starting document ingestion...");

        const docsDir = path.join(__dirname, "../docs");
        const results = await RAGService.ingestDirectory(docsDir);

        console.log("\n📊 Ingestion Summary:");
        console.log("═".repeat(50));

        let totalChunks = 0;
        results.forEach((result) => {
            console.log(`✓ ${result.file}: ${result.chunks} chunks`);
            totalChunks += result.chunks;
        });

        console.log("═".repeat(50));
        console.log(`Total: ${results.length} files, ${totalChunks} chunks`);
        console.log("\n✨ Document ingestion complete!");

        process.exit(0);
    } catch (error) {
        console.error("❌ Document ingestion failed:", error);
        process.exit(1);
    }
};

ingestDocuments();
