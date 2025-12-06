// cron.js

const fs = require('fs');
const path = require('path');
// Ensure generateTotp is correctly exported from cryptoUtils.js
const { generateTotp } = require('./cryptoUtils'); 

const SEED_FILE = path.join('/data', 'seed.txt');

function logCurrentTotp() {
    try {
        // 1. Read hex seed from persistent storage 
        const hexSeed = fs.readFileSync(SEED_FILE, 'utf8').trim();
        
        // 2. Generate current TOTP code 
        const code = generateTotp(hexSeed);

        // 3. Get current UTC timestamp and format (YYYY-MM-DD HH:MM:SS)
        const now = new Date();
        const timestamp = now.toISOString().replace('T', ' ').substring(0, 19);

        // 4. Output formatted line: "[timestamp] - 2FA Code: {code}"
        const logLine = `[${timestamp}] - 2FA Code: ${code}`;
        
        // Print to stdout (cron will redirect this)
        console.log(logLine);

    } catch (error) {
        // Handle file not found gracefully
        if (error.code === 'ENOENT') {
            // This is expected before the first /decrypt-seed
            console.error(`[CRON ERROR] Seed file not found at ${SEED_FILE}.`);
        } else {
            console.error(`[CRON ERROR] Failed to generate or log TOTP: ${error.message}`);
        }
    }
}

logCurrentTotp();