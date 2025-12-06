#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { totp } = require('otplib');

// 1. Read seed
let seed;
try {
    seed = fs.readFileSync(path.join(__dirname, '../data/seed.txt'), 'utf8').trim();
} catch (err) {
    console.error('Seed file not found!');
    process.exit(1);
}

// 2. Convert hex to base32
function hexToBase32(hex) {
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    let bits = '';
    for (let i = 0; i < hex.length; i++) {
        bits += parseInt(hex[i], 16).toString(2).padStart(4, '0');
    }
    let base32 = '';
    for (let i = 0; i < bits.length; i += 5) {
        const chunk = bits.slice(i, i + 5).padEnd(5, '0');
        base32 += alphabet[parseInt(chunk, 2)];
    }
    return base32;
}

const base32Seed = hexToBase32(seed);

// 3. Generate TOTP code
totp.options = { digits: 6, step: 30 };
const code = totp.generate(base32Seed);

// 4. Get UTC timestamp
const timestamp = new Date().toISOString().replace('T', ' ').split('.')[0];

// 5. Print formatted line
console.log(`[${timestamp}] - 2FA Code: ${code}`);
