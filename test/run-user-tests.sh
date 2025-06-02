#!/bin/bash

# User Model Test Runner
# This script runs the comprehensive unit and integration tests for the User model

echo "🧪 Running User Model Tests..."
echo "================================"

# Set test environment
export NODE_ENV=test
export TEST_DATABASE_URL=${TEST_DATABASE_URL:-"mongodb://localhost:27017/pontonesia_test"}

# Check if MongoDB is running (optional)
if command -v mongosh &> /dev/null; then
    echo "📊 Checking MongoDB connection..."
    if mongosh --eval "db.runCommand('ping')" --quiet $TEST_DATABASE_URL &> /dev/null; then
        echo "✅ MongoDB is running and accessible"
    else
        echo "⚠️  MongoDB may not be running. Integration tests may be skipped."
    fi
else
    echo "ℹ️  MongoDB CLI not found. Skipping connection check."
fi

echo ""
echo "🔧 Running Unit Tests..."
echo "------------------------"
npx mocha -r ts-node/register -r tsconfig-paths/register test/user.unit.test.ts --exit --timeout 5000

echo ""
echo "🔗 Running Integration Tests..."
echo "-------------------------------"
npx mocha -r ts-node/register -r tsconfig-paths/register test/user.integration.test.ts --exit --timeout 10000

echo ""
echo "🚀 Running All User Tests Together..."
echo "------------------------------------"
npx mocha -r ts-node/register -r tsconfig-paths/register test/user.*.test.ts --exit --timeout 10000

echo ""
echo "✨ Test run completed!"
echo "=====================" 