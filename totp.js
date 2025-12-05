// totp.js
const { totp } = require("otplib");

// Convert hex → base32
function hexToBase32(hexString) {
  const bytes = Buffer.from(hexString, "hex");
  return bytes.toString("base64").replace(/=/g, "");
}

// STEP 6.1: Generate TOTP code
function generate_totp_code(hex_seed) {
  const base32Secret = hexToBase32(hex_seed);

  totp.options = {
    digits: 6,
    step: 30, // 30 seconds
    algorithm: "sha1"   // MUST be lowercase
  };

  return totp.generate(base32Secret);
}

// STEP 6.2: Verify TOTP code
function verify_totp_code(hex_seed, code, valid_window = 1) {
  const base32Secret = hexToBase32(hex_seed);

  totp.options = {
    digits: 6,
    step: 30,
    algorithm: "sha1",
    window: valid_window
  };

  return totp.check(code, base32Secret);
}

module.exports = {
  generate_totp_code,
  verify_totp_code,
};
