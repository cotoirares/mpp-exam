#!/bin/bash

echo "🚀 Building backend for deployment..."

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Install tsx globally for running TypeScript
echo "📦 Installing tsx..."
npm install -g tsx

# Build the TypeScript files if needed
echo "🔧 Building TypeScript files..."
npx tsc --noEmit --skipLibCheck

echo "✅ Build complete!" 