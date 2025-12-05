const fs = require('fs');
const https = require('https');

// Your details
const studentId = '23MH1A05M1';
const githubRepoUrl = 'https://github.com/23MH1A05M1/Build-Secure-PKI-Based-2FA-Microservice-with-Docker';
const apiHost = 'eajeyq4r3zljoq4rpovy2nthda0vtjqf.lambda-url.ap-south-1.on.aws';

// Read your student public key
let publicKey;
try {
  publicKey = fs.readFileSync('keys/student_public.pem', 'utf-8');
  console.log('✅ Loaded student_public.pem successfully');
} catch (err) {
  console.error('❌ Failed to read student_public.pem:', err.message);
  process.exit(1);
}

// Prepare JSON payload
const postData = JSON.stringify({
  student_id: studentId,
  github_repo_url: githubRepoUrl,
  public_key: publicKey
});

// HTTPS request options
const options = {
  hostname: apiHost,
  path: '/',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData)
  }
};

// Send request
const req = https.request(options, (res) => {
  let data = '';

  console.log('HTTP Status Code:', res.statusCode);

  res.on('data', chunk => { data += chunk; });

  res.on('end', () => {
    console.log('Raw API response:', data);

    try {
      const resp = JSON.parse(data);

      // Check if encrypted_seed exists
      if (resp.encrypted_seed) {
        fs.writeFileSync('encrypted_seed.txt', resp.encrypted_seed);
        console.log('✅ Encrypted seed saved to encrypted_seed.txt');
      } else {
        console.error('❌ API did not return encrypted_seed:', resp);
      }
    } catch (e) {
      console.error('❌ Failed to parse API response as JSON:', e.message);
    }
  });
});

req.on('error', e => console.error('❌ Request failed:', e.message));

req.write(postData);
req.end();
