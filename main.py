from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import os
import time

from crypto_utils import load_private_key, decrypt_seed
from totp_utils import generate_totp_code, verify_totp_code


app = FastAPI()

PRIVATE_KEY_PATH = "student_private.pem"
SEED_FILE_PATH = "/data/seed.txt"


# -----------------------------
# Endpoint 1: POST /decrypt-seed
# -----------------------------

class DecryptRequest(BaseModel):
    encrypted_seed: str

@app.post("/decrypt-seed")
def decrypt_seed_endpoint(payload: DecryptRequest):

    try:
        # Load RSA private key
        private_key = load_private_key(PRIVATE_KEY_PATH)

        # Decrypt seed
        seed = decrypt_seed(payload.encrypted_seed, private_key)

        # Ensure /data directory exists
        os.makedirs(os.path.dirname(SEED_FILE_PATH), exist_ok=True)

        # Save decrypted seed
        with open(SEED_FILE_PATH, "w") as f:
            f.write(seed)

        return {"status": "ok"}

    except Exception:
        raise HTTPException(status_code=500, detail="Decryption failed")



# -----------------------------
# Endpoint 2: GET /generate-2fa
# -----------------------------

@app.get("/generate-2fa")
def generate_2fa():

    # Check if seed file exists
    if not os.path.exists(SEED_FILE_PATH):
        raise HTTPException(status_code=500, detail="Seed not decrypted yet")

    # Read hex seed
    with open(SEED_FILE_PATH, "r") as f:
        hex_seed = f.read().strip()

    # Generate TOTP code
    try:
        code = generate_totp_code(hex_seed)
    except Exception:
        raise HTTPException(status_code=500, detail="TOTP generation failed")

    # Calculate remaining seconds in the current 30s window
    now = int(time.time())
    valid_for = 30 - (now % 30)

    return {
        "code": code,
        "valid_for": valid_for
    }



# -----------------------------
# Endpoint 3: POST /verify-2fa
# -----------------------------

class VerifyRequest(BaseModel):
    code: str

@app.post("/verify-2fa")
def verify_2fa(payload: VerifyRequest):

    if not payload.code:
        raise HTTPException(status_code=400, detail="Missing code")

    # Check if seed is available
    if not os.path.exists(SEED_FILE_PATH):
        raise HTTPException(status_code=500, detail="Seed not decrypted yet")

    # Read seed
    with open(SEED_FILE_PATH, "r") as f:
        hex_seed = f.read().strip()

    # Verify TOTP
    try:
        is_valid = verify_totp_code(hex_seed, payload.code, valid_window=1)
    except Exception:
        raise HTTPException(status_code=500, detail="Verification error")

    return {"valid": is_valid}
