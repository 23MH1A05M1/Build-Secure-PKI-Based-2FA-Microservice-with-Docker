#!/usr/bin/env python3
import base64
import subprocess
import sys

from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import padding


# ---- Paths to key files ----
STUDENT_PRIVATE_KEY_PATH = "student_private.pem"
INSTRUCTOR_PUBLIC_KEY_PATH = "instructor_public.pem"


# -------------------------------------------------
# 1. Get current commit hash (40-character hex)
# -------------------------------------------------
def get_current_commit_hash() -> str:
    """
    Run: git log -1 --format=%H
    Returns the latest commit hash as a string.
    """
    try:
        output = subprocess.check_output(
            ["git", "log", "-1", "--format=%H"],
            stderr=subprocess.DEVNULL,
        )
        commit_hash = output.decode("utf-8").strip()
        if len(commit_hash) != 40:
            raise ValueError("Unexpected commit hash length")
        return commit_hash
    except Exception as e:
        print(f"Error getting git commit hash: {e}", file=sys.stderr)
        sys.exit(1)


# -------------------------------------------------
# 2. Load keys
# -------------------------------------------------
def load_private_key(path: str):
    with open(path, "rb") as f:
        return serialization.load_pem_private_key(f.read(), password=None)


def load_public_key(path: str):
    with open(path, "rb") as f:
        return serialization.load_pem_public_key(f.read())


# -------------------------------------------------
# 3. Sign message with RSA-PSS-SHA256
# -------------------------------------------------
def sign_message(message: str, private_key) -> bytes:
    """
    Sign a message using RSA-PSS with SHA-256.

    Implementation:
    1. Encode commit hash as ASCII/UTF-8 bytes
       (CRITICAL: sign the ASCII string, NOT binary hex)
    2. Sign using RSA-PSS with:
        - Padding: PSS
        - MGF: MGF1 with SHA-256
        - Hash Algorithm: SHA-256
        - Salt Length: Maximum
    3. Return signature bytes
    """
    message_bytes = message.encode("utf-8")

    signature = private_key.sign(
        message_bytes,
        padding.PSS(
            mgf=padding.MGF1(hashes.SHA256()),
            salt_length=padding.PSS.MAX_LENGTH,
        ),
        hashes.SHA256(),
    )
    return signature


# -------------------------------------------------
# 4. Encrypt signature with RSA-OAEP-SHA256
# -------------------------------------------------
def encrypt_with_public_key(data: bytes, public_key) -> bytes:
    """
    Encrypt data using RSA/OAEP with SHA-256.

    Implementation:
    1. Encrypt signature bytes using RSA/OAEP with:
        - Padding: OAEP
        - MGF: MGF1 with SHA-256
        - Hash Algorithm: SHA-256
        - Label: None
    2. Return encrypted ciphertext bytes
    """
    ciphertext = public_key.encrypt(
        data,
        padding.OAEP(
            mgf=padding.MGF1(algorithm=hashes.SHA256()),
            algorithm=hashes.SHA256(),
            label=None,
        ),
    )
    return ciphertext


# -------------------------------------------------
# 5. Full proof generation
# -------------------------------------------------
def main():
    # 1. Get commit hash
    commit_hash = get_current_commit_hash()

    # 2. Load student private key
    student_private_key = load_private_key(STUDENT_PRIVATE_KEY_PATH)

    # 3. Sign commit hash with student private key (RSA-PSS-SHA256)
    signature = sign_message(commit_hash, student_private_key)

    # 4. Load instructor public key
    instructor_public_key = load_public_key(INSTRUCTOR_PUBLIC_KEY_PATH)

    # 5. Encrypt signature with instructor public key (RSA-OAEP-SHA256)
    encrypted_signature = encrypt_with_public_key(signature, instructor_public_key)

    # 6. Base64-encode encrypted signature
    encrypted_signature_b64 = base64.b64encode(encrypted_signature).decode("ascii")

    # Output for submission
    print("Commit Hash:", commit_hash)
    print("Encrypted Signature:", encrypted_signature_b64)


if __name__ == "__main__":
    main()