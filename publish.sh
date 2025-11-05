#!/bin/bash

# Publishing script for react-native-t-schedule

set -e

echo "🚀 Publishing react-native-t-schedule to npm"
echo "=============================================="
echo ""

# Check if logged in
echo "📋 Step 1: Checking npm login status..."
if npm whoami > /dev/null 2>&1; then
    echo "✅ Logged in as: $(npm whoami)"
else
    echo "❌ Not logged in to npm"
    echo ""
    echo "Please run: npm login"
    echo "Then run this script again."
    exit 1
fi

echo ""
echo "📋 Step 2: Running final checks..."

# Run tests
echo "Running tests..."
yarn test
if [ $? -ne 0 ]; then
    echo "❌ Tests failed. Fix tests before publishing."
    exit 1
fi
echo "✅ Tests passed"

# Build
echo "Building package..."
yarn prepare
if [ $? -ne 0 ]; then
    echo "❌ Build failed. Fix build errors before publishing."
    exit 1
fi
echo "✅ Build successful"

# Type check
echo "Type checking..."
yarn typecheck
if [ $? -ne 0 ]; then
    echo "❌ Type check failed. Fix TypeScript errors before publishing."
    exit 1
fi
echo "✅ Type check passed"

echo ""
echo "📋 Step 3: Package preview..."
npm pack --dry-run

echo ""
echo "📋 Step 4: Ready to publish!"
echo ""
read -p "Do you want to publish react-native-t-schedule@0.1.0 to npm? (yes/no) " -r
echo ""

if [[ $REPLY =~ ^[Yy][Ee][Ss]$ ]] || [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "📦 Publishing to npm..."
    npm publish
    
    if [ $? -eq 0 ]; then
        echo ""
        echo "🎉 Successfully published react-native-t-schedule@0.1.0!"
        echo ""
        echo "View your package at:"
        echo "https://www.npmjs.com/package/react-native-t-schedule"
        echo ""
        echo "Install with:"
        echo "npm install react-native-t-schedule"
        echo "or"
        echo "yarn add react-native-t-schedule"
    else
        echo ""
        echo "❌ Publishing failed. Check the error messages above."
        exit 1
    fi
else
    echo "❌ Publishing cancelled."
    exit 0
fi

