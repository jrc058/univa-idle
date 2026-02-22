#!/bin/bash
# Safe backup script for univa-raids

set -e

BACKUP_DIR=~/backups/univa-raids
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
PROJECT_DIR=~/Documents/univa-raids

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

# Create timestamped backup
echo "Creating backup..."
tar -czf "$BACKUP_DIR/univa-raids-$TIMESTAMP.tar.gz" \
    -C ~/Documents \
    --exclude='node_modules' \
    --exclude='dist' \
    --exclude='*.log' \
    univa-raids/

echo "✓ Backup created: $BACKUP_DIR/univa-raids-$TIMESTAMP.tar.gz"

# Keep only last 10 backups
cd "$BACKUP_DIR"
ls -t univa-raids-*.tar.gz | tail -n +11 | xargs -r rm
echo "✓ Old backups cleaned (keeping last 10)"

# Show backup size
du -h "$BACKUP_DIR/univa-raids-$TIMESTAMP.tar.gz"
