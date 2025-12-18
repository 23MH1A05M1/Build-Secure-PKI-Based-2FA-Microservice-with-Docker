#!/usr/bin/env python3
import os
import sys
import datetime

# Allow Python to import totp_utils.py from /app
sys.path.append("/app")

from totp_utils import generate_totp_code

SEED_FILE = "/data/seed.txt"

def read_seed():
    """Read the decrypted hex seed from persistent storage."""
    if not os.path.exists(SEED_FILE):
        return None
    try:
        with open(SEED_FILE, "r") as f:
            return f.read().strip()
    except:
        return None

def main():
    hex_seed = read_seed()
    if not hex_seed:
        print("Seed not found")
        return

    # Generate TOTP code from seed
    try:
        code = generate_totp_code(hex_seed)
    except Exception as e:
        print(f"Error generating TOTP: {e}")
        return

    # Get current UTC timestamp
    timestamp = datetime.datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")

    # Output format (cron appends this into /cron/last_code.txt)
    print(f"{timestamp} - 2FA Code: {code}")

if __name__ == "__main__":
    main()