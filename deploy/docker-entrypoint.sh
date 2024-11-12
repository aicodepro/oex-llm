#!/bin/sh

# Start your application with pm2 using the environment variables
SERVER_URL_TENANT_API="${SERVER_URL_TENANT_API}" \
API_TOKEN_TENANT_SEVARS="${API_TOKEN_TENANT_SEVARS}" \
node generatePM2Config.js

# Start your application with pm2
pm2-runtime start ecosystem.config.js