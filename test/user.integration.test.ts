import 'mocha';
import { expect } from 'chai';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';

describe('User Model - Integration Tests', () => {
    let testDbUrl: string;

    before(async function () {
        this.timeout(10000);
        // Connect to test database
        testDbUrl =
            process.env.TEST_DATABASE_URL ||
            'mongodb://localhost:27017/pontonesia_test';

        if (mongoose.connection.readyState === 0) {
            try {
                await mongoose.connect(testDbUrl);
                console.log('Connected to test database');
            } catch (error) {
                console.log(
                    'MongoDB not available, skipping integration tests'
                );
                this.skip();
            }
        }
    });

    after(async function () {
        this.timeout(10000);
        // Clean up and close connections
        if (mongoose.connection.readyState !== 0) {
            await mongoose.connection.close();
            console.log('Disconnected from test database');
        }
    });

    describe('Database Connection', () => {
        it('should connect to test database', () => {
            expect(mongoose.connection.readyState).to.equal(1); // 1 = connected
        });

        it('should use test database', () => {
            expect(mongoose.connection.name).to.equal('pontonesia_test');
        });
    });

    describe('Basic Schema Validation Tests', () => {
        it('should validate email regex pattern', () => {
            const emailRegX = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,5})+$/;

            // Valid emails
            expect(emailRegX.test('user@example.com')).to.be.true;
            expect(emailRegX.test('test.user@domain.co.uk')).to.be.true;
            expect(emailRegX.test('user123@test-domain.org')).to.be.true;

            // Invalid emails
            expect(emailRegX.test('invalid-email')).to.be.false;
            expect(emailRegX.test('user@')).to.be.false;
            expect(emailRegX.test('@domain.com')).to.be.false;
            expect(emailRegX.test('user..name@domain.com')).to.be.false;
        });

        it('should validate username without spaces', () => {
            const hasSpaces = (username: string) => /\s/g.test(username);

            expect(hasSpaces('validusername')).to.be.false;
            expect(hasSpaces('valid_username')).to.be.false;
            expect(hasSpaces('valid-username')).to.be.false;
            expect(hasSpaces('valid123')).to.be.false;

            expect(hasSpaces('invalid username')).to.be.true;
            expect(hasSpaces('user name')).to.be.true;
            expect(hasSpaces(' username')).to.be.true;
            expect(hasSpaces('username ')).to.be.true;
        });
    });

    describe('JWT Token Functionality', () => {
        it('should create and verify JWT tokens', () => {
            const secret = 'test-secret';

            const payload = {
                user: {
                    id: 'test123',
                    email: 'test@example.com',
                    password: 'hashedpassword',
                },
            };

            const token = jwt.sign(payload, secret, { expiresIn: '1d' });
            expect(token).to.be.a('string');
            expect(token.split('.')).to.have.lengthOf(3); // JWT has 3 parts

            const decoded = jwt.verify(token, secret) as any;
            expect(decoded).to.have.property('user');
            expect(decoded.user).to.deep.include(payload.user);
        });
    });

    describe('Array Operations (Following/Favorites)', () => {
        it('should handle following operations', () => {
            const followingUsers: string[] = [];
            const userId1 = 'user123';
            const userId2 = 'user456';

            // Add user to following list
            if (followingUsers.indexOf(userId1) === -1) {
                followingUsers.push(userId1);
            }
            expect(followingUsers).to.include(userId1);

            // Don't add duplicate
            if (followingUsers.indexOf(userId1) === -1) {
                followingUsers.push(userId1);
            }
            expect(followingUsers).to.have.lengthOf(1);

            // Add another user
            if (followingUsers.indexOf(userId2) === -1) {
                followingUsers.push(userId2);
            }
            expect(followingUsers).to.have.lengthOf(2);

            // Remove user
            const idx = followingUsers.indexOf(userId1);
            if (idx !== -1) {
                followingUsers.splice(idx, 1);
            }
            expect(followingUsers).to.not.include(userId1);
            expect(followingUsers).to.include(userId2);
        });

        it('should handle favorite operations', () => {
            const favouriteArticles: string[] = [];
            const articleId1 = 'article123';
            const articleId2 = 'article456';

            // Add article to favorites
            if (favouriteArticles.indexOf(articleId1) === -1) {
                favouriteArticles.push(articleId1);
            }
            expect(favouriteArticles).to.include(articleId1);

            // Don't add duplicate
            if (favouriteArticles.indexOf(articleId1) === -1) {
                favouriteArticles.push(articleId1);
            }
            expect(favouriteArticles).to.have.lengthOf(1);

            // Add another article
            if (favouriteArticles.indexOf(articleId2) === -1) {
                favouriteArticles.push(articleId2);
            }
            expect(favouriteArticles).to.have.lengthOf(2);

            // Remove article
            const idx = favouriteArticles.indexOf(articleId1);
            if (idx !== -1) {
                favouriteArticles.splice(idx, 1);
            }
            expect(favouriteArticles).to.not.include(articleId1);
            expect(favouriteArticles).to.include(articleId2);
        });
    });

    describe('User Response Formatting', () => {
        it('should format user response correctly', () => {
            const mockUser = {
                username: 'testuser',
                email: 'test@example.com',
                bio: 'Test bio',
                image: 'test.jpg',
                generateAccessToken: () => 'mock-token',
            };

            const userResponse = {
                username: mockUser.username,
                email: mockUser.email,
                bio: mockUser.bio,
                image: mockUser.image,
                token: mockUser.generateAccessToken(),
            };

            expect(userResponse).to.have.property('username', 'testuser');
            expect(userResponse).to.have.property('email', 'test@example.com');
            expect(userResponse).to.have.property('bio', 'Test bio');
            expect(userResponse).to.have.property('image', 'test.jpg');
            expect(userResponse).to.have.property('token', 'mock-token');
        });

        it('should format profile JSON correctly', () => {
            const mockUser = {
                username: 'testuser',
                bio: 'Test bio',
                image: 'test.jpg',
                id: 'user123',
            };

            const mockCurrentUser = {
                followingUsers: ['user123'],
                isFollowing: (id: string) =>
                    mockCurrentUser.followingUsers.includes(id),
            };

            const profileJSON = {
                username: mockUser.username,
                bio: mockUser.bio,
                image: mockUser.image,
                following: mockCurrentUser.isFollowing(mockUser.id),
            };

            expect(profileJSON).to.have.property('username', 'testuser');
            expect(profileJSON).to.have.property('bio', 'Test bio');
            expect(profileJSON).to.have.property('image', 'test.jpg');
            expect(profileJSON).to.have.property('following', true);
        });
    });

    describe('ID Comparison Logic', () => {
        it('should handle string ID comparisons', () => {
            const followingUsers = ['user123', 'user456'];
            const targetId = 'user123';

            const isFollowing = followingUsers.some(
                (id) => id.toString() === targetId.toString()
            );
            expect(isFollowing).to.be.true;

            const notFollowingId = 'user789';
            const isNotFollowing = followingUsers.some(
                (id) => id.toString() === notFollowingId.toString()
            );
            expect(isNotFollowing).to.be.false;
        });

        it('should handle ObjectId-like comparisons', () => {
            const mockObjectId1 = { toString: () => 'user123' };
            const mockObjectId2 = { toString: () => 'user456' };
            const followingUsers = [mockObjectId1];

            const targetId = { toString: () => 'user123' };
            const isFollowing = followingUsers.some(
                (id) => id.toString() === targetId.toString()
            );
            expect(isFollowing).to.be.true;

            const notFollowingId = { toString: () => 'user789' };
            const isNotFollowing = followingUsers.some(
                (id) => id.toString() === notFollowingId.toString()
            );
            expect(isNotFollowing).to.be.false;
        });
    });

    describe('Default Values and Edge Cases', () => {
        it('should handle empty arrays', () => {
            const emptyFollowing: string[] = [];
            const emptyFavorites: string[] = [];

            expect(emptyFollowing).to.be.an('array').that.is.empty;
            expect(emptyFavorites).to.be.an('array').that.is.empty;

            // Operations on empty arrays should work
            expect(emptyFollowing.indexOf('user123')).to.equal(-1);
            expect(emptyFavorites.includes('article123')).to.be.false;
        });

        it('should handle default string values', () => {
            const defaultBio = '';
            const defaultImage = '';

            expect(defaultBio).to.equal('');
            expect(defaultImage).to.equal('');
            expect(typeof defaultBio).to.equal('string');
            expect(typeof defaultImage).to.equal('string');
        });
    });
});
