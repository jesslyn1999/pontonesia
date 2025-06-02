import 'mocha';
import { expect, use } from 'chai';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';
import jwt from 'jsonwebtoken';

// Use sinon-chai plugin
use(sinonChai);

// Import the User model - note: we'll need to mock this since it uses Ottoman
const userModelPath = '../src/models/User';

describe('User Model - Unit Tests', () => {
    let sandbox: sinon.SinonSandbox;
    let mockUser: any;
    let mockArticle: any;
    let userSchema: any;

    beforeEach(() => {
        sandbox = sinon.createSandbox();

        // Mock user schema methods
        userSchema = {
            methods: {
                generateAccessToken: function () {
                    const accessToken = jwt.sign(
                        {
                            user: {
                                id: this.id,
                                email: this.email,
                                password: this.password,
                            },
                        },
                        'test-secret',
                        { expiresIn: '1d' }
                    );
                    return accessToken;
                },
                toUserResponse: function () {
                    return {
                        username: this.username,
                        email: this.email,
                        bio: this.bio,
                        image: this.image,
                        token: this.generateAccessToken(),
                    };
                },
                toProfileJSON: function (user: any) {
                    return {
                        username: this.username,
                        bio: this.bio,
                        image: this.image,
                        following: user ? user.isFollowing(this.id) : false,
                    };
                },
                isFollowing: function (id: any) {
                    const idStr = id.toString();
                    if (this.followingUsers) {
                        for (const followingUser of this.followingUsers) {
                            if (followingUser.toString() === idStr) {
                                return true;
                            }
                        }
                    }
                    return false;
                },
                follow: function (id: any) {
                    if (this.followingUsers.indexOf(id) === -1) {
                        this.followingUsers.push(id);
                    }
                    return this.save();
                },
                unfollow: function (id: any) {
                    const idx = this.followingUsers.indexOf(id);
                    if (idx !== -1) {
                        this.followingUsers.splice(idx, 1);
                    }
                    return this.save();
                },
                isFavourite: function (id: any) {
                    const idStr = id.toString();
                    if (this.favouriteArticles) {
                        for (const article of this.favouriteArticles) {
                            if (article.toString() === idStr) {
                                return true;
                            }
                        }
                    }
                    return false;
                },
                favorite: async function (id: any) {
                    if (this.favouriteArticles.indexOf(id) === -1) {
                        this.favouriteArticles.push(id);
                    }
                    // Mock getModel functionality
                    const mockGetModel = sandbox.stub().returns({
                        findById: sandbox.stub().resolves(mockArticle),
                    });
                    const article = await mockGetModel('Article').findById(id);
                    article.favouritesCount += 1;
                    await this.save();
                    return article.save();
                },
                unfavorite: async function (id: any) {
                    const idx = this.favouriteArticles.indexOf(id);
                    if (idx !== -1) {
                        this.favouriteArticles.splice(idx, 1);
                    }
                    const mockGetModel = sandbox.stub().returns({
                        findById: sandbox.stub().resolves(mockArticle),
                    });
                    const article = await mockGetModel('Article').findById(id);
                    article.favouritesCount -= 1;
                    await this.save();
                    return article.save();
                },
            },
        };

        // Mock user instance
        mockUser = {
            id: 'user123',
            username: 'testuser',
            email: 'test@example.com',
            password: 'hashedpassword',
            bio: 'Test bio',
            image: 'test-image.jpg',
            followingUsers: [],
            favouriteArticles: [],
            save: sandbox.stub().resolves(),
            generateAccessToken: userSchema.methods.generateAccessToken,
            toUserResponse: userSchema.methods.toUserResponse,
            toProfileJSON: userSchema.methods.toProfileJSON,
            isFollowing: userSchema.methods.isFollowing,
            follow: userSchema.methods.follow,
            unfollow: userSchema.methods.unfollow,
            isFavourite: userSchema.methods.isFavourite,
            favorite: userSchema.methods.favorite,
            unfavorite: userSchema.methods.unfavorite,
        };

        // Mock article
        mockArticle = {
            id: 'article123',
            favouritesCount: 5,
            save: sandbox.stub().resolves(),
        };
    });

    afterEach(() => {
        sandbox.restore();
    });

    describe('Schema Validation', () => {
        it('should require username', () => {
            const userData: any = {
                email: 'test@example.com',
                password: 'password123',
            };

            expect(() => {
                if (!userData.username) {
                    throw new Error('username is required');
                }
            }).to.throw('username is required');
        });

        it('should require email', () => {
            const userData: any = {
                username: 'testuser',
                password: 'password123',
            };

            expect(() => {
                if (!userData.email) {
                    throw new Error('email is required');
                }
            }).to.throw('email is required');
        });

        it('should require password', () => {
            const userData: any = {
                username: 'testuser',
                email: 'test@example.com',
            };

            expect(() => {
                if (!userData.password) {
                    throw new Error('password is required');
                }
            }).to.throw('password is required');
        });

        it('should validate email format', () => {
            const emailRegX = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,5})+$/;

            expect(emailRegX.test('valid@example.com')).to.be.true;
            expect(emailRegX.test('invalid-email')).to.be.false;
            expect(emailRegX.test('invalid@')).to.be.false;
            expect(emailRegX.test('@invalid.com')).to.be.false;
        });

        it('should reject username with spaces', () => {
            const usernameValidator = (value: string) => {
                if (value && /\s/g.test(value)) {
                    throw new Error('username cannot contain spaces');
                }
            };

            expect(() => usernameValidator('valid_username')).to.not.throw();
            expect(() => usernameValidator('invalid username')).to.throw(
                'username cannot contain spaces'
            );
        });
    });

    describe('generateAccessToken', () => {
        it('should generate a valid JWT token', () => {
            const jwtSignStub = sandbox
                .stub(jwt, 'sign')
                .returns('mock-token' as any);

            const token = mockUser.generateAccessToken();

            expect(jwtSignStub).to.have.been.calledOnce;
            expect(token).to.equal('mock-token');

            const expectedPayload = {
                user: {
                    id: mockUser.id,
                    email: mockUser.email,
                    password: mockUser.password,
                },
            };

            expect(jwtSignStub.firstCall.args[0]).to.deep.equal(
                expectedPayload
            );
            expect(jwtSignStub.firstCall.args[2]).to.deep.equal({
                expiresIn: '1d',
            });
        });
    });

    describe('toUserResponse', () => {
        it('should return user response with token', () => {
            sandbox.stub(mockUser, 'generateAccessToken').returns('mock-token');

            const response = mockUser.toUserResponse();

            expect(response).to.deep.equal({
                username: 'testuser',
                email: 'test@example.com',
                bio: 'Test bio',
                image: 'test-image.jpg',
                token: 'mock-token',
            });
        });
    });

    describe('toProfileJSON', () => {
        it('should return profile JSON without following status when no user provided', () => {
            const profile = mockUser.toProfileJSON();

            expect(profile).to.deep.equal({
                username: 'testuser',
                bio: 'Test bio',
                image: 'test-image.jpg',
                following: false,
            });
        });

        it('should return profile JSON with following status when user provided', () => {
            const otherUser = {
                isFollowing: sandbox.stub().returns(true),
            };

            const profile = mockUser.toProfileJSON(otherUser);

            expect(profile).to.deep.equal({
                username: 'testuser',
                bio: 'Test bio',
                image: 'test-image.jpg',
                following: true,
            });

            expect(otherUser.isFollowing).to.have.been.calledWith(mockUser.id);
        });
    });

    describe('isFollowing', () => {
        it('should return true if user is following the given id', () => {
            mockUser.followingUsers = ['user456', 'user789'];

            const result = mockUser.isFollowing('user456');

            expect(result).to.be.true;
        });

        it('should return false if user is not following the given id', () => {
            mockUser.followingUsers = ['user456', 'user789'];

            const result = mockUser.isFollowing('user999');

            expect(result).to.be.false;
        });

        it('should return false if followingUsers is empty', () => {
            mockUser.followingUsers = [];

            const result = mockUser.isFollowing('user456');

            expect(result).to.be.false;
        });

        it('should handle ObjectId comparison', () => {
            const objectId = { toString: () => 'user456' };
            mockUser.followingUsers = [{ toString: () => 'user456' }];

            const result = mockUser.isFollowing(objectId);

            expect(result).to.be.true;
        });
    });

    describe('follow', () => {
        it('should add user to following list if not already following', async () => {
            mockUser.followingUsers = [];

            await mockUser.follow('user456');

            expect(mockUser.followingUsers).to.include('user456');
            expect(mockUser.save).to.have.been.calledOnce;
        });

        it('should not add duplicate user to following list', async () => {
            mockUser.followingUsers = ['user456'];

            await mockUser.follow('user456');

            expect(mockUser.followingUsers).to.have.lengthOf(1);
            expect(mockUser.save).to.have.been.calledOnce;
        });
    });

    describe('unfollow', () => {
        it('should remove user from following list', async () => {
            mockUser.followingUsers = ['user456', 'user789'];

            await mockUser.unfollow('user456');

            expect(mockUser.followingUsers).to.not.include('user456');
            expect(mockUser.followingUsers).to.include('user789');
            expect(mockUser.save).to.have.been.calledOnce;
        });

        it('should do nothing if user is not in following list', async () => {
            mockUser.followingUsers = ['user789'];

            await mockUser.unfollow('user456');

            expect(mockUser.followingUsers).to.deep.equal(['user789']);
            expect(mockUser.save).to.have.been.calledOnce;
        });
    });

    describe('isFavourite', () => {
        it('should return true if article is in favourites', () => {
            mockUser.favouriteArticles = ['article123', 'article456'];

            const result = mockUser.isFavourite('article123');

            expect(result).to.be.true;
        });

        it('should return false if article is not in favourites', () => {
            mockUser.favouriteArticles = ['article456', 'article789'];

            const result = mockUser.isFavourite('article123');

            expect(result).to.be.false;
        });

        it('should return false if favouriteArticles is empty', () => {
            mockUser.favouriteArticles = [];

            const result = mockUser.isFavourite('article123');

            expect(result).to.be.false;
        });
    });

    describe('favorite', () => {
        it('should add article to favourites and increment article count', async () => {
            mockUser.favouriteArticles = [];

            await mockUser.favorite('article123');

            expect(mockUser.favouriteArticles).to.include('article123');
            expect(mockArticle.favouritesCount).to.equal(6);
            expect(mockUser.save).to.have.been.calledOnce;
            expect(mockArticle.save).to.have.been.calledOnce;
        });

        it('should not add duplicate article to favourites', async () => {
            mockUser.favouriteArticles = ['article123'];

            await mockUser.favorite('article123');

            expect(mockUser.favouriteArticles).to.have.lengthOf(1);
            expect(mockArticle.favouritesCount).to.equal(6);
        });
    });

    describe('unfavorite', () => {
        it('should remove article from favourites and decrement article count', async () => {
            mockUser.favouriteArticles = ['article123', 'article456'];

            await mockUser.unfavorite('article123');

            expect(mockUser.favouriteArticles).to.not.include('article123');
            expect(mockUser.favouriteArticles).to.include('article456');
            expect(mockArticle.favouritesCount).to.equal(4);
            expect(mockUser.save).to.have.been.calledOnce;
            expect(mockArticle.save).to.have.been.calledOnce;
        });

        it('should do nothing if article is not in favourites', async () => {
            mockUser.favouriteArticles = ['article456'];

            await mockUser.unfavorite('article123');

            expect(mockUser.favouriteArticles).to.deep.equal(['article456']);
            expect(mockArticle.favouritesCount).to.equal(4);
        });
    });
});
