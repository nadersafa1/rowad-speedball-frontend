#!/bin/sh
set -e

echo "🚀 Starting Rowad Speedball Frontend..."
echo "📅 $(date)"

# Run database migrations
echo "🔄 Running database migrations..."
npm run db:push

echo "✅ Migrations complete!"
echo "🌐 Starting Next.js application..."

# Start the application
exec node server.js

