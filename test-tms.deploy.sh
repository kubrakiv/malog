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

echo "Starting deployment..."
echo "Branch: $BRANCH"

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

# Optional: prompt for version (can be empty for staging)
read -p "Enter version (e.g., v1.0.0) or press Enter to use timestamp only: " VERSION
STAMP=$(date +%Y%m%d_%H%M)
RELEASE_NAME="${VERSION:+${VERSION}_}${STAMP}"
REL="$APP_ROOT/releases/$RELEASE_NAME"

echo "Release path: $REL"
echo "Timestamp: $STAMP"
echo "📦 Creating release: $RELEASE_NAME"

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
echo "Generating frontend/.env from shared config..."
grep '^REACT_APP_' "$APP_ROOT/shared/.env.staging" > .env
npm ci
npm run build
cd "$REL"

# Make symlink to .env.staging from shared to release
echo "Creating symlink to .env.staging..."
ln -sf "$APP_ROOT/shared/.env.staging" "$REL/.env.staging"

# Make symlink for media folder (must be before migrate/collectstatic so
# AppConfig.ready() finds MEDIA_ROOT already pointing to shared/media)
echo "Creating symlink for media folder..."
ln -sfn "$APP_ROOT/shared/media" "$REL/media"

# Ensure the images subdirectory exists inside shared/media
mkdir -p "$APP_ROOT/shared/media/images"
sudo chown -R www-data:www-data "$APP_ROOT/shared/media"

# Run database migrations
echo "Running database migrations..."
"$APP_ROOT/shared/venv/bin/python" manage.py migrate --noinput --settings=backend.env.staging

# Collect Django static files (admin CSS/JS and app static) for this release
echo "Collecting static files..."
"$APP_ROOT/shared/venv/bin/python" manage.py collectstatic --noinput --settings=backend.env.staging

# Switch current symlink only after successful preparation
echo "Switching current symlink to new release..."
ln -sfn "$REL" "$CURRENT_DIR"

# Restart uwsgi
echo "Restarting uwsgi..."
sudo systemctl restart uwsgi

echo "Deployment completed successfully!"
echo ""
echo "=============================================="
echo "✅ Staging TMS deployment complete!"
echo "=============================================="
echo ""
echo "📦 Release: $RELEASE_NAME"
echo "📂 Current: $CURRENT_DIR"
echo ""
