import { Client } from '@upstash/qstash';
import dotenv from 'dotenv';

dotenv.config();

async function scheduleIndexing() {
    if (!process.env.QSTASH_TOKEN) {
        throw new Error('QSTASH_TOKEN is required');
    }

    if (!process.env.DOCS_DEPLOYMENT_URL) {
        throw new Error('DOCS_DEPLOYMENT_URL is required');
    }

    const c = new Client({
        token: process.env.QSTASH_TOKEN
    });

    try {
        // Schedule the job to run every day at midnight UTC
        const scheduleResponse = await c.schedules.create({
            destination: `${process.env.DOCS_DEPLOYMENT_URL}/api/indexDocs`,
            cron: "0 0 * * *" // Every day at midnight UTC
        });

        console.log('Successfully scheduled docs indexing:');
        console.log('Schedule ID:', scheduleResponse.scheduleId);
    } catch (error) {
        console.error('Error scheduling docs indexing:', error);
        process.exit(1);
    }
}

scheduleIndexing();