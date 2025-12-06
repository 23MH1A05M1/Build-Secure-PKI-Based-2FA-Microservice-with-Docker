const fs = require('fs');
const crypto = require('crypto');
const path = require('path');
const { authenticator } = require('otplib'); // Library for generating TOTP codes

// --- Configuration Paths ---
// Path to your student private key
const PRIVATE_KEY_PATH = path.join(__dirname, 'keys', 'student_private.pem');
// Required output path for the decrypted seed
const SEED_FILE_PATH = path.join(path.sep, 'data', 'seed.txt'); 

// Load student private key once when this module starts
let studentPrivateKey;
try {
    // Read the private key file
    studentPrivateKey = fs.readFileSync(PRIVATE_KEY_PATH, 'utf8');
} catch (e) {
    console.error(`❌ Error loading student private key: ${e.message}`);
}

/**
 * 🔓 Performs RSA Decryption and saves the plain-text seed.
 * This function is used by the POST /decrypt-seed endpoint.
 * @param {string} encryptedSeedB64 - Base64 string from the API request body.
 * @returns {string} The decrypted 64-character hex seed.
 */
function decryptAndSaveSeed(encryptedSeedB64) {
    if (!studentPrivateKey) {
        throw new Error("Student private key failed to load.");
    }
    
    // Convert Base64 string to a Buffer for decryption
    const encryptedBuffer = Buffer.from(encryptedSeedB64, 'base64');

    // Decrypt using RSA-OAEP with SHA-256
    const decryptedBuffer = crypto.privateDecrypt(
        {
            key: studentPrivateKey,
            padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
            oaepHash: 'sha256'
        },
        encryptedBuffer
    );

    const decryptedSeed = decryptedBuffer.toString('utf8').trim();

    // Validate the decrypted seed format
    if (!/^[0-9a-f]{64}$/i.test(decryptedSeed)) {
        throw new Error("Invalid decrypted seed (not 64 hex chars)");
    }

    // Save the decrypted seed to the required location (/data/seed.txt)
    const dataDir = path.dirname(SEED_FILE_PATH);
    if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
    }
    fs.writeFileSync(SEED_FILE_PATH, decryptedSeed, 'utf8');
    
    return decryptedSeed; 
}


/**
 * 💾 Reads the decrypted seed from /data/seed.txt.
 * @returns {string} The hex seed.
 */
function getDecryptedSeed() {
    if (!fs.existsSync(SEED_FILE_PATH)) {
        throw new Error("Seed not decrypted yet");
    }
    return fs.readFileSync(SEED_FILE_PATH, 'utf8').trim();
}

/**
 * 🔑 Generates a 6-digit TOTP code and calculates the time remaining.
 * This is used by the GET /generate-2fa endpoint.
 * @param {string} hexSeed - The decrypted 64-character hex seed.
 * @returns {{code: string, valid_for: number}} The code and remaining time in seconds.
 */
function generateTotp(hexSeed) {
    // Set TOTP options: 30-second window, no look-ahead/behind window
    authenticator.options = { step: 30, window: 0 };
    
    // otplib accepts the hex seed directly as the secret
    const code = authenticator.generate(hexSeed); 
    
    // Calculate remaining time in the current 30-second period
    const secondsRemaining = authenticator.timeUsed();
    const validFor = authenticator.step - secondsRemaining;
    
    // If validFor is exactly 30, it means the period just started, return 0
    const validForAdjusted = validFor === 30 ? 0 : validFor;

    return { code, valid_for: validForAdjusted };
}

/**
 * ✅ Verifies a given 6-digit code against the current seed.
 * This is used by the POST /verify-2fa endpoint.
 * @param {string} hexSeed - The decrypted 64-character hex seed.
 * @param {string} code - The 6-digit code to verify.
 * @returns {boolean} True if the code is valid, False otherwise.
 */
function verifyTotp(hexSeed, code) {
    // Set TOTP options: 30-second window, tolerance of ±1 period (90 seconds total)
    authenticator.options = { step: 30, window: 1 };
    
    // Check if the code is valid within the tolerance window
    const isValid = authenticator.check(code, hexSeed); 
    
    return isValid;
}


// Export all functions needed by the server
module.exports = { 
    decryptAndSaveSeed, 
    getDecryptedSeed, 
    generateTotp,
    verifyTotp
};