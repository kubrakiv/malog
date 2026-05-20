#!/usr/bin/env bash

# Deployment script for malog application on Linux server
# This script handles cloning the repository, installing dependencies,
# building the frontend, and restarting the application

set -e  # Exit on any error

# Set variables
BRANCH=staging
REPO_SSH=git@github.com:kubrakiv/malog.git
APP_ROOT=/home/kubrakiv/test-malog/malog-app
CURRENT_DIR=$APP_ROOT/current
STAMP=$(date +%F_%H-%M-%S)
REL=$APP_ROOT/releases/$STAMP

echo "Starting deployment..."
echo "Branch: $BRANCH"
echo "Release path: $REL"
echo "Timestamp: $STAMP"

# Show current deployed version (what "current" symlink points to)
if [ -L "$CURRENT_DIR" ]; then
	CURRENT_RELEASE=$(basename "$(readlink -f "$CURRENT_DIR" 2>/dev/null)" 2>/dev/null)
	if [ -n "$CURRENT_RELEASE" ]; then
		echo "📍 Currently deployed on server: $CURRENT_RELEASE"
		echo ""
	fi
elif [ -d "$APP_ROOT/releases" ]; then
	LATEST_IN_RELEASES=$(ls -1t "$APP_ROOT/releases" 2>/dev/null | head -n 1)
	if [ -n "$LATEST_IN_RELEASES" ]; then
		echo "📍 Latest release in releases/: $LATEST_IN_RELEASES (current symlink may differ)"
		echo ""
	fi
fi

# Create a release folder
echo "Creating release folder..."
mkdir -p "$REL"

# Clone project from git
echo "Cloning repository from $REPO_SSH..."
git clone --depth 1 --branch "$BRANCH" "$REPO_SSH" "$REL"

# Go to release folder
echo "Navigating to release folder..."
cd "$REL"

# Install dependencies from requirements file
echo "Installing Python dependencies..."
"$APP_ROOT/shared/venv/bin/pip" install -r requirements.txt

# Build frontend
echo "Building frontend..."
cd "$REL/frontend"
npm ci
npm run build
cd "$REL"

# Make symlink to .env.staging from shared to release
echo "Creating symlink to .env.staging..."
ln -sf "$APP_ROOT/shared/.env.staging" "$REL/.env.staging"

# Run database migrations
echo "Running database migrations..."
"$APP_ROOT/shared/venv/bin/python" manage.py migrate --noinput --settings=backend.env.staging

# Make symlink for media folder
echo "Creating symlink for media folder..."
ln -sfn "$APP_ROOT/shared/media" "$REL/media"

# Switch current symlink only after successful preparation
echo "Switching current symlink to new release..."
ln -sfn "$REL" "$CURRENT_DIR"

# Restart uwsgi
echo "Restarting uwsgi..."
sudo systemctl restart uwsgi

echo "Deployment completed successfully!"
