import dotenv from 'dotenv';
import Docs2Vector from "@upstash/docs2vector";
import path from 'path';

// Load environment variables
dotenv.config();

async function main() {
    console.time('Processing Time');
    try {
        // GitHub repository URL
        const githubRepoUrl = 'https://github.com/Abdusshh/docusaurus-search';

        console.log(`Starting processing for the repository: ${githubRepoUrl}`);

        // Initialize Docs2Vector with your Upstash Vector credentials
        const converter = new Docs2Vector({
            upstashVectorUrl: process.env.UPSTASH_VECTOR_REST_URL!,
            upstashVectorToken: process.env.UPSTASH_VECTOR_REST_TOKEN!
        });

        // Run the processing flow
        await converter.run(githubRepoUrl);

        console.log(`Successfully processed repository: ${githubRepoUrl}`);
        console.log('Vectors stored in Upstash Vector database.');
        console.timeEnd('Processing Time');
    } catch (error: any) {
        console.timeEnd('Processing Time');
        console.error('An error occurred while processing the repository:', error.message);
    }
}

main();