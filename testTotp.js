const fs = require("fs");
const { generate_totp_code, verify_totp_code } = require("./totp");

// Load your decrypted seed
const seed = fs.readFileSync("decrypted_seed.txt", "utf8").trim();

// Generate TOTP
const code = generate_totp_code(seed);
console.log("Generated TOTP:", code);

// Verify TOTP
const isValid = verify_totp_code(seed, code);
console.log("Verify:", isValid);
