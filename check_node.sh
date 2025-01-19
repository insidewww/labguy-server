#!/bin/bash

echo "Checking if any Node.js process is running..."

# Check if any Node.js process is running
ps cax | grep node > /dev/null

# Check if the process is running
if [ $? -eq 0 ]; then
  echo "Process is running."
else
  echo "Process is not running."
  # Ensure PM2 is in the PATH
  PATH=$PATH:/usr/local/bin
  # Start the process using PM2
  echo "Starting process with PM2..."
  pm2 start www
fi
