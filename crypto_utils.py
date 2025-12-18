import base64
from cryptography.hazmat.primitives.asymmetric import padding
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives import serialization

def load_private_key(path: str):
    with open(path, "rb") as f:
        return serialization.load_pem_private_key(
            f.read(),
            password=None
        )
def decrypt_seed(encrypted_seed_b64: str, private_key) -> str:
    """
    Decrypt base64-encoded encrypted seed using RSA/OAEP
    """

    # 1. Base64 decode
    try:
        encrypted_bytes = base64.b64decode(encrypted_seed_b64)
    except Exception:
        raise ValueError("Invalid base64 input")

    # 2. RSA OAEP decrypt (SHA-256, MGF1-SHA256)
    try:
        decrypted_bytes = private_key.decrypt(
            encrypted_bytes,
            padding.OAEP(
                mgf=padding.MGF1(algorithm=hashes.SHA256()),
                algorithm=hashes.SHA256(),
                label=None
            )
        )
    except Exception:
        raise ValueError("RSA decryption failed")

    # 3. UTF-8 decode
    try:
        hex_seed = decrypted_bytes.decode("utf-8")
    except Exception:
        raise ValueError("Decrypted seed is not UTF-8 text")

    # 4. Validate hex seed
    if len(hex_seed) != 64:
        raise ValueError("Seed must be 64 characters")

    allowed = "0123456789abcdef"
    if any(c not in allowed for c in hex_seed):
        raise ValueError("Seed contains invalid hex characters")

    return hex_seed