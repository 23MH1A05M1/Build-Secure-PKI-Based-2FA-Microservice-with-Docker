#!/bin/bash

set -e

SEED_FILE="/data/seed.txt"
LOG_FILE="/cron/last_code.txt"

# Exit if seed not available
if [[ ! -f "$SEED_FILE" ]]; then
    echo "Seed missing" >&2
    exit 1
fi

# Generate TOTP
SEED=$(cat $SEED_FILE)
CODE=$(python3 - <<EOF
from totp_utils import generate_totp_code
print(generate_totp_code("$SEED"))
EOF
)

# Log with timestamp (UTC)
echo "$(date -u '+%Y-%m-%d %H:%M:%S') - 2FA Code: $CODE" > "$LOG_FILE"