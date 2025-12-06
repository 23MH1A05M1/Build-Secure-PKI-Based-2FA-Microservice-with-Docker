const express = require('express');
const bodyParser = require('body-parser');
const { 
    decryptAndSaveSeed, 
    getDecryptedSeed, 
    generateTotp,
    verifyTotp
} = require('./cryptoUtils'); // Functions imported from cryptoUtils.js

const app = express();
const PORT = 8080; 

// Middleware to parse incoming JSON requests
app.use(bodyParser.json());

// -----------------------------------------------------------------
// 1. POST /decrypt-seed
// -----------------------------------------------------------------
app.post('/decrypt-seed', (req, res) => {
    const encryptedSeedB64 = req.body.encrypted_seed;
    // ... (rest of the /decrypt-seed logic) ...
    if (!encryptedSeedB64) {
        return res.status(400).json({ "error": "Missing encrypted_seed in request body" });
    }

    try {
        decryptAndSaveSeed(encryptedSeedB64);
        console.log("✅ Seed successfully decrypted and saved.");
        res.status(200).json({ "status": "ok" });
    } catch (error) {
        console.error("❌ Decryption failed:", error.message);
        res.status(500).json({ "error": "Decryption failed" });
    }
});

// -----------------------------------------------------------------
// 2. GET /generate-2fa
// -----------------------------------------------------------------
app.get('/generate-2fa', (req, res) => {
    try {
        const hexSeed = getDecryptedSeed();
        
        const { code, valid_for } = generateTotp(hexSeed);

        res.status(200).json({ 
            "code": code, 
            "valid_for": valid_for 
        });

    } catch (error) {
        if (error.message === "Seed not decrypted yet") {
            return res.status(500).json({ "error": "Seed not decrypted yet. Run /decrypt-seed first." });
        }
        console.error("❌ Error generating 2FA:", error.message);
        res.status(500).json({ "error": "Internal server error" });
    }
});

// -----------------------------------------------------------------
// 3. POST /verify-2fa
// -----------------------------------------------------------------
app.post('/verify-2fa', (req, res) => {
    const code = req.body.code;
    // ... (rest of the /verify-2fa logic) ...
    if (!code) {
        return res.status(400).json({ "error": "Missing code in request body" });
    }

    try {
        const hexSeed = getDecryptedSeed();

        const isValid = verifyTotp(hexSeed, code); 
        
        res.status(200).json({ "valid": isValid });

    } catch (error) {
        if (error.message === "Seed not decrypted yet") {
            return res.status(500).json({ "error": "Seed not decrypted yet. Run /decrypt-seed first." });
        }
        console.error("❌ Error verifying 2FA:", error.message);
        res.status(500).json({ "error": "Internal server error" });
    }
});


// Start the server
app.listen(PORT, () => {
    console.log(`🚀 2FA Microservice running on port ${PORT}`);
});