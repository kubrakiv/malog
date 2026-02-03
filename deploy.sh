#!/bin/bash

# Deployment script for malog application on Linux server
# This script handles cloning the repository, installing dependencies,
# building the frontend, and restarting the application

set -e  # Exit on any error

# Set variables
BRANCH=staging
REPO_SSH=git@github.com:kubrakiv/malog.git
APP_ROOT=/home/kubrakiv/test-malog/malog-app
STAMP=$(date +%F_%H-%M-%S)
REL=$APP_ROOT/releases/$STAMP

echo "Starting deployment..."
echo "Branch: $BRANCH"
echo "Release path: $REL"
echo "Timestamp: $STAMP"

# Create a release folder
echo "Creating release folder..."
mkdir -p "$REL"

# Clone project from git
echo "Cloning repository from $REPO_SSH..."
git clone --depth 1 --branch "$BRANCH" "$REPO_SSH" "$REL"

# Make symlink to current folder
echo "Creating symlink to current folder..."
ln -sfn "$REL" "$APP_ROOT/current"

# Go to current folder
echo "Navigating to current folder..."
cd "$APP_ROOT/current"

# Install dependencies from requirements file
echo "Installing Python dependencies..."
"$APP_ROOT/shared/venv/bin/pip" install -r requirements.txt

# Build frontend
echo "Building frontend..."
cd "$REL/frontend"
npm ci
npm run build
cd "$REL"

# Make symlink to .env.staging from shared to current
echo "Creating symlink to .env.staging..."
ln -sf /home/kubrakiv/test-malog/malog-app/shared/.env.staging /home/kubrakiv/test-malog/malog-app/current/.env.staging

# Run database migrations
echo "Running database migrations..."
"$APP_ROOT/shared/venv/bin/python" manage.py migrate --noinput --settings=backend.env.staging

# Make symlink for media folder
echo "Creating symlink for media folder..."
ln -sfn "$APP_ROOT/shared/media" "$REL/media"

# Restart uwsgi
echo "Restarting uwsgi..."
sudo systemctl restart uwsgi

echo "Deployment completed successfully!"
