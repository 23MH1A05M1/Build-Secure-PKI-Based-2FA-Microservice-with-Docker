# --- Dockerfile Instructions ---

# 1. BASE IMAGE: Start from the official Node.js 20 on Alpine Linux (lightweight)
FROM node:20-alpine

# 2. WORKING DIRECTORY: Set the default path for our application
WORKDIR /usr/src/app

# 3. COPY PACKAGE: Copy package files for dependency installation
COPY package*.json ./

# 4. INSTALL DEPENDENCIES: Install dependencies AND cron daemon packages
RUN npm install --omit=dev && \
    apk update && \
    apk add --no-cache bash busybox-suid

# 5. COPY SOURCE CODE: Copy all other files (server.js, cryptoUtils.js, keys/, cron.js, etc.)
COPY . .

# 6. COPY CRON CONFIGURATION: Copy the file that tells cron what to run
COPY cron/2fa-cron /etc/crontabs/root

# 7. CREATE DIRECTORY: This is essential for the decryption endpoint to save the seed file
# Also needed for the cron output log.
RUN mkdir -p /data 

# 8. SET PERMISSIONS: Ensure the container user can write to the /data folder
RUN chmod -R 777 /data

# 9. EXPOSE PORT: Document which port the application listens on
EXPOSE 8080

# 10. STARTUP COMMAND: Run the cron daemon AND the server simultaneously
CMD [ "/bin/sh", "-c", "crond && node server.js" ]