import { VercelRequest, VercelResponse } from '@vercel/node';
import Docs2Vector from "@upstash/docs2vector";

interface ReindexRequestBody {
    github_repo_url: string;
}

// Vercel serverless function
export default async function handler(
    req: VercelRequest,
    res: VercelResponse
) {
    // Only allow POST requests
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { github_repo_url } = req.body as ReindexRequestBody;

        // Validate required fields
        if (!github_repo_url) {
            return res.status(400).json({ 
                error: 'Missing required field: github_repo_url' 
            });
        }

        // Validate environment variables
        if (!process.env.UPSTASH_VECTOR_REST_URL || 
            !process.env.UPSTASH_VECTOR_REST_TOKEN || 
            !process.env.GITHUB_TOKEN) {
            return res.status(500).json({ 
                error: 'Missing required environment variables. Please ensure UPSTASH_VECTOR_REST_URL, UPSTASH_VECTOR_REST_TOKEN, and GITHUB_TOKEN are set in your Vercel environment.' 
            });
        }

        // Initialize Docs2Vector (it will use all credentials from env variables)
        const converter = new Docs2Vector();

        console.log(`Starting processing for the repository: ${github_repo_url}`);

        // Run the processing flow
        await converter.run(github_repo_url);

        console.log('Successfully processed repository');
        return res.status(200).json({ 
            success: true, 
            message: 'Repository successfully processed and vectors stored' 
        });

    } catch (error: any) {
        console.error('An error occurred:', error.message);
        return res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
}
