#!/bin/bash
set -e

echo "🐳 Building Docker image for cine-vip-server..."

# Navigate to project root
cd "$(dirname "$0")/../.."

# Build the image
docker build -f apps/server/Dockerfile -t cine-vip-server:latest .

echo "✅ Build complete!"
echo ""
echo "To run the container:"
echo "  docker run -p 3000:3000 --env-file apps/server/.env cine-vip-server:latest"
echo ""
echo "To test health check:"
echo "  curl http://localhost:3000/api/health"
