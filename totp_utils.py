import pyotp
import base64

def generate_totp_code(hex_seed: str) -> str:
    """
    Generate current TOTP code from 64-character hex seed
    """

    # 1. Convert hex → bytes
    try:
        seed_bytes = bytes.fromhex(hex_seed)
    except Exception:
        raise ValueError("Invalid hex seed")

    # 2. Convert bytes → base32 (required by TOTP)
    seed_base32 = base64.b32encode(seed_bytes).decode("utf-8")

    # 3. Create TOTP generator (SHA-1, 30s period, 6 digits)
    totp = pyotp.TOTP(seed_base32, digits=6, interval=30)  # SHA-1 is default

    # 4. Generate the code
    return totp.now()


def verify_totp_code(hex_seed: str, code: str, valid_window: int = 1) -> bool:
    """
    Verify a TOTP code with time window tolerance

    valid_window = number of 30-second periods to allow
    (default = 1 → accept previous, current, and next period)
    """

    # Convert hex → bytes
    try:
        seed_bytes = bytes.fromhex(hex_seed)
    except Exception:
        return False

    # Convert bytes → base32
    seed_base32 = base64.b32encode(seed_bytes).decode("utf-8")

    # Create TOTP generator
    totp = pyotp.TOTP(seed_base32, digits=6, interval=30)

    # Verify with tolerance window
    return totp.verify(code, valid_window=valid_window)
