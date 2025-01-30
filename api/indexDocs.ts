import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { Document } from "@langchain/core/documents";
import { OpenAIEmbeddings } from "@langchain/openai";
import { Index } from "@upstash/vector";
import { promises as fs } from 'fs';
import path from 'path';
import crypto from 'crypto';
import type { Request, Response } from 'express';

// Get minimum file length from env or default to 10
const DEFAULT_MIN_FILE_LENGTH = 10;
const DEFAULT_INDEX_NAMESPACE = 'docusaurus-search-upstash';

const MIN_FILE_LENGTH = parseInt(process.env.MIN_FILE_LENGTH || String(DEFAULT_MIN_FILE_LENGTH), 10);
const INDEX_NAMESPACE = process.env.UPSTASH_VECTOR_INDEX_NAMESPACE || DEFAULT_INDEX_NAMESPACE;

// Generate a unique ID for content chunks
function generateId(content: string): string {
    return crypto.createHash('md5').update(content).digest('hex');
}

// Find all markdown files in a directory
async function findMarkdownFiles(dir: string): Promise<{ included: string[], excluded: string[] }> {
    const files = await fs.readdir(dir, { withFileTypes: true });
    let includedFiles: string[] = [];
    let excludedFiles: string[] = [];

    for (const file of files) {
        const fullPath = path.join(dir, file.name);

        if (file.isDirectory() && !file.name.startsWith('.')) {
            const subFiles = await findMarkdownFiles(fullPath);
            includedFiles = [...includedFiles, ...subFiles.included];
            excludedFiles = [...excludedFiles, ...subFiles.excluded];
        } else if (file.name.match(/\.(md|mdx)$/)) {
            try {
                const content = await fs.readFile(fullPath, 'utf-8');
                const lineCount = content.split('\n').length;
                
                if (lineCount >= MIN_FILE_LENGTH) {
                    includedFiles.push(fullPath);
                } else {
                    excludedFiles.push(fullPath);
                }
            } catch (error) {
                console.error(`Error reading file ${fullPath}:`, error);
                excludedFiles.push(fullPath);
            }
        }
    }

    return { included: includedFiles, excluded: excludedFiles };
}

// Process a single markdown file
async function processFile(filePath: string, textSplitter: RecursiveCharacterTextSplitter, embeddings: OpenAIEmbeddings | null) {
    const content = await fs.readFile(filePath, 'utf-8');
    const relativePath = path.relative(process.cwd(), filePath);

    const doc = new Document({ pageContent: content });
    const chunks = await textSplitter.splitDocuments([doc]);

    // Create processed chunks
    const processedChunks = await Promise.all(chunks.map(async chunk => {
        const base = {
            id: generateId(chunk.pageContent),
            metadata: {
                fileName: path.basename(filePath),
                filePath: relativePath,
                fileType: path.extname(filePath).substring(1),
                timestamp: new Date().getTime()
            }
        };

        // Generate embeddings via OpenAI if API key is provided
        if (embeddings) {
            const [vector] = await embeddings.embedDocuments([chunk.pageContent]);
            return { ...base, vector, data: chunk.pageContent };
        }
        // No embeddings, just store the content
        return { ...base, data: chunk.pageContent };
    }));

    return processedChunks;
}

export default async function handler(req: Request, res: Response) {
    // Only allow POST requests
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        console.time('Total processing time');
        // Initialize Upstash Vector
        const index = new Index({
            url: process.env.UPSTASH_VECTOR_REST_URL!,
            token: process.env.UPSTASH_VECTOR_REST_TOKEN!
        });

        // Initialize OpenAI embeddings if API key is provided
        let embeddings = null;
        if (process.env.OPENAI_API_KEY) {
            embeddings = new OpenAIEmbeddings({
                openAIApiKey: process.env.OPENAI_API_KEY
            });
        }

        // Initialize text splitter
        const textSplitter = new RecursiveCharacterTextSplitter({
            chunkSize: 1000,
            chunkOverlap: 200,
            separators: ["\n\n", "\n", " ", ""]
        });

        const docsDir = path.join(process.cwd(), 'docs');
        console.log(`Processing docs directory: ${docsDir}`);
        console.log(`Minimum file length: ${MIN_FILE_LENGTH} lines`);

        // Find markdown files
        const { included: markdownFiles, excluded: excludedFiles } = await findMarkdownFiles(docsDir);
        console.log(`Found ${markdownFiles.length + excludedFiles.length} total markdown files`);
        console.log(`Processing ${markdownFiles.length} files (${excludedFiles.length} files excluded due to length < ${MIN_FILE_LENGTH} lines)`);

        // if (excludedFiles.length > 0) {
        //     console.log('Excluded files:', excludedFiles.map(f => path.relative(process.cwd(), f)));
        // }

        // Process markdown files
        let allChunks = [];
        for (const file of markdownFiles) {
            // console.log(`Processing file: ${file}`);
            const chunks = await processFile(file, textSplitter, embeddings);
            allChunks = [...allChunks, ...chunks];
        }

        // Store embeddings in Upstash Vector
        console.log(`Storing ${allChunks.length} chunks in Upstash Vector`);
        const batchSize = 100; 
        await index.reset({ namespace: INDEX_NAMESPACE });
        for (let i = 0; i < allChunks.length; i += batchSize) {
            const batch = allChunks.slice(i, i + batchSize);
            await index.upsert(batch, { namespace: INDEX_NAMESPACE });
            console.log(`Processed batch ${Math.floor(i / batchSize) + 1} of ${Math.ceil(allChunks.length / batchSize)}`);
        }

        console.timeEnd('Total processing time');
        res.status(200).json({
            success: true,
            processedFiles: markdownFiles.length,
            excludedFiles: excludedFiles.length,
            totalChunks: allChunks.length,
            excludedFilePaths: excludedFiles.map(f => path.relative(process.cwd(), f))
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Failed to index docs' });
    }
}
