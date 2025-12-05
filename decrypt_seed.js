const fs = require('fs');
const crypto = require('crypto');

// Paths
const privateKeyPath = 'keys/student_private.pem';
const encryptedSeedPath = 'encrypted_seed.txt';

try {
  const privateKey = fs.readFileSync(privateKeyPath, 'utf-8');
  const encryptedSeedB64 = fs.readFileSync(encryptedSeedPath, 'utf-8');

  // Convert base64 to buffer
  const encryptedBuffer = Buffer.from(encryptedSeedB64, 'base64');

  // Decrypt using RSA-OAEP with SHA-256
  const decryptedBuffer = crypto.privateDecrypt(
    {
      key: privateKey,
      padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
      oaepHash: 'sha256'
    },
    encryptedBuffer
  );

  const decryptedSeed = decryptedBuffer.toString('utf-8').trim();

  // Validate 64-character hexadecimal
  const hexRegex = /^[0-9a-f]{64}$/;
  if (!hexRegex.test(decryptedSeed)) {
    console.error('❌ Decrypted seed is not a valid 64-character hexadecimal string:', decryptedSeed);
  } else {
    console.log('✅ Decrypted 64-character hex seed:', decryptedSeed);
  }

} catch (err) {
  console.error('❌ Error during decryption:', err.message);
}
