############################
# Stage 1 — Builder
############################
FROM python:3.11-slim AS builder

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt


############################
# Stage 2 — Runtime
############################
FROM python:3.11-slim

WORKDIR /app

ENV TZ=UTC

RUN apt-get update && apt-get install -y \
    cron \
    tzdata \
 && rm -rf /var/lib/apt/lists/*

COPY --from=builder /usr/local/lib/python3.11 /usr/local/lib/python3.11
COPY --from=builder /usr/local/bin /usr/local/bin

# Copy application code
COPY . .

# Create volumes
RUN mkdir -p /data /cron && chmod 755 /data /cron

# Install cron job
COPY cron/2fa-cron /etc/cron.d/2fa-cron
RUN chmod 0644 /etc/cron.d/2fa-cron
RUN crontab /etc/cron.d/2fa-cron

EXPOSE 8080

CMD service cron start && uvicorn main:app --host 0.0.0.0 --port 8080