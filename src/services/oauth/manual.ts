import { Request, Response } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import UserBasicInfoSchema from '../../models/user/basicInfo'
import userProfileGeneralSchema from '../../models/user/profile/general'
import { Types } from 'mongoose'
import { AUTH } from '../../configs/env'

interface SignUpData {
    email: string
    password: string
    name: string
    firstName?: string
    lastName?: string
    language?: string
}

interface LoginData {
    email: string
    password: string
}

export class ManualAuthService {
    private static instance: ManualAuthService
    private readonly JWT_SECRET = AUTH.JWT_SECRET
    private readonly SALT_ROUNDS = AUTH.SALT_ROUNDS

    private constructor() {}

    public static getInstance(): ManualAuthService {
        if (!ManualAuthService.instance) {
            ManualAuthService.instance = new ManualAuthService()
        }
        return ManualAuthService.instance
    }

    private generateToken(userId: string): string {
        return jwt.sign({ userId }, this.JWT_SECRET, { expiresIn: AUTH.JWT_EXPIRES_IN })
    }

    private async hashPassword(password: string): Promise<string> {
        return bcrypt.hash(password, this.SALT_ROUNDS)
    }

    private async comparePasswords(password: string, hashedPassword: string): Promise<boolean> {
        return bcrypt.compare(password, hashedPassword)
    }

    async signUp(data: SignUpData) {
        try {
            // Check if user already exists
            const existingUser = await UserBasicInfoSchema.findOne({ email: data.email })
            if (existingUser) {
                throw new Error('Email already registered')
            }

            // Hash password
            const hashedPassword = await this.hashPassword(data.password)

            // Create user
            const userId = new Types.ObjectId()
            const user = await UserBasicInfoSchema.create({
                _id: userId,
                email: data.email,
                password: hashedPassword,
                name: data.name,
                authProvider: 'manual',
                isEmailVerified: false,
                status: 'active'
            })

            // Create general profile
            await userProfileGeneralSchema.create({
                userId,
                firstName: data.firstName || data.name.split(' ')[0],
                lastName: data.lastName || data.name.split(' ').slice(1).join(' '),
                language: data.language || 'en'
            })

            // Generate token
            const token = this.generateToken(userId.toString())

            return {
                token,
                user: {
                    id: user._id,
                    email: user.email,
                    name: user.name,
                    isEmailVerified: user.isEmailVerified
                }
            }
        } catch (error) {
            throw error
        }
    }

    async login(data: LoginData) {
        try {
            // Find user
            const user = await UserBasicInfoSchema.findOne({ email: data.email })
            if (!user) {
                throw new Error('Invalid email or password')
            }

            // Verify password
            const isValidPassword = await this.comparePasswords(data.password, user.password)
            if (!isValidPassword) {
                throw new Error('Invalid email or password')
            }

            // Check if user is active
            if (user.status !== 'active') {
                throw new Error('Account is not active')
            }

            // Generate token
            const token = this.generateToken(user._id.toString())

            return {
                token,
                user: {
                    id: user._id,
                    email: user.email,
                    name: user.name,
                    isEmailVerified: user.isEmailVerified
                }
            }
        } catch (error) {
            throw error
        }
    }

    async handleSignUp(req: Request, res: Response) {
        try {
            const result = await this.signUp(req.body)
            return res.status(201).json({
                message: 'Sign up successful',
                ...result
            })
        } catch (error) {
            console.error('Sign up error:', error)
            if (error instanceof Error) {
                return res.status(400).json({ error: error.message })
            }
            return res.status(500).json({ error: 'Internal server error' })
        }
    }

    async handleLogin(req: Request, res: Response) {
        try {
            const result = await this.login(req.body)
            return res.status(200).json({
                message: 'Login successful',
                ...result
            })
        } catch (error) {
            console.error('Login error:', error)
            if (error instanceof Error) {
                return res.status(401).json({ error: error.message })
            }
            return res.status(500).json({ error: 'Internal server error' })
        }
    }
}

export const manualAuthService = ManualAuthService.getInstance()
