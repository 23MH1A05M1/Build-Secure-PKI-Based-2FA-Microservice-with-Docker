const fs = require('fs');
const crypto = require('crypto');

// Generate RSA 4096-bit key pair
function generateRSAKeyPair() {
  const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
    modulusLength: 4096,        // key size
    publicExponent: 0x10001,    // 65537
    publicKeyEncoding: {
      type: 'spki',             // recommended for public key
      format: 'pem'
    },
    privateKeyEncoding: {
      type: 'pkcs8',            // recommended for private key
      format: 'pem'
    }
  });

  // Save keys to files
  fs.writeFileSync('keys/student_private.pem', privateKey);
  fs.writeFileSync('keys/student_public.pem', publicKey);

  console.log('✅ RSA 4096-bit key pair generated successfully!');
}

generateRSAKeyPair();
