# User Model Tests

This directory contains comprehensive unit and integration tests for the User model.

## Test Structure

### Unit Tests (`user.unit.test.ts`)
- **Schema Validation**: Tests for required fields, email format, username validation
- **generateAccessToken**: Tests JWT token generation
- **toUserResponse**: Tests user response formatting
- **toProfileJSON**: Tests profile JSON formatting with/without following status
- **isFollowing**: Tests following status checking
- **follow/unfollow**: Tests user following/unfollowing functionality
- **isFavourite**: Tests article favorite status checking
- **favorite/unfavorite**: Tests article favoriting functionality

### Integration Tests (`user.integration.test.ts`)
- **Database Operations**: Tests actual database CRUD operations
- **User Methods Integration**: Tests methods with real database interactions
- **Article Favorites Integration**: Tests favorite/unfavorite with mocked Article model
- **Database Queries**: Tests various query operations
- **Validation Edge Cases**: Tests edge cases and error handling

## Prerequisites

1. **MongoDB**: Ensure MongoDB is running locally on port 27017
2. **Dependencies**: Install test dependencies:
   ```bash
   npm install --save-dev sinon @types/sinon
   ```

## Environment Setup

Create a `.env.test` file in the project root with:

```env
NODE_ENV=test
TEST_DATABASE_URL=mongodb://localhost:27017/pontonesia_test
DATABASE_URL=mongodb://localhost:27017/pontonesia_test
JWT_SECRET=test-jwt-secret-key-for-testing-only
SESSION_SECRET=test-session-secret-for-testing-only
PORT=3001
LOG_LEVEL=error
DISABLE_EXTERNAL_SERVICES=true
```

## Running Tests

### Run All Tests
```bash
npm test
```

### Run Specific Test Files
```bash
# Unit tests only
npx mocha -r ts-node/register test/user.unit.test.ts --exit

# Integration tests only
npx mocha -r ts-node/register test/user.integration.test.ts --exit
```

### Run Tests with Debug Mode
```bash
npm run test:debug
```

## Test Coverage

The tests cover:

- ✅ Schema validation and constraints
- ✅ JWT token generation and validation
- ✅ User response formatting
- ✅ Profile JSON generation
- ✅ Following/unfollowing functionality
- ✅ Article favoriting functionality
- ✅ Database CRUD operations
- ✅ Unique constraint validation
- ✅ Email format validation
- ✅ Username space validation
- ✅ Default value handling
- ✅ Error handling and edge cases

## Notes

1. **Database Isolation**: Integration tests use a separate test database (`pontonesia_test`)
2. **Cleanup**: Tests automatically clean up data before and after execution
3. **Mocking**: Unit tests use Sinon for mocking external dependencies
4. **Ottoman vs Mongoose**: The current tests assume Mongoose usage; adjust if using Ottoman/Couchbase

## Troubleshooting

### MongoDB Connection Issues
- Ensure MongoDB is running: `brew services start mongodb-community` (macOS)
- Check connection string in `.env.test`
- Verify database permissions

### Test Timeout Issues
- Increase timeout in `test/mocha.opts` if needed
- Check database connection speed

### Import/Module Issues
- Ensure all dependencies are installed
- Check TypeScript configuration in `tsconfig.json`
- Verify module paths are correct 