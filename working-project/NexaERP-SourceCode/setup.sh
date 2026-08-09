#!/usr/bin/env bash
# UniversalERP Quick Setup
set -e

echo "🚀 Setting up UniversalERP..."
npm create vite@latest nexaerp-app -- --template react-ts
cd nexaerp-app

# Copy source files
cp -r ../frontend/* ./

# Install deps
npm install
npm install jszip recharts react-router-dom
npm install -D tailwindcss postcss autoprefixer tailwindcss-animate

echo "✅ Done! Run: npm run dev"
