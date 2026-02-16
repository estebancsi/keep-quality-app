#!/bin/sh

# Substitute environment variables in config.template.json and write to config.json
envsubst < /usr/share/nginx/html/config.template.json > /usr/share/nginx/html/config.json

# Execute the CMD
exec "$@"
