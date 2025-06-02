import mongoose from 'mongoose'
const Schema = mongoose.Schema

const userVerificationSchema = new Schema(
    {
        _id: { type: Schema.Types.ObjectId, auto: true },
        userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        
        // KYC Verification
        kycStatus: {
            type: String,
            enum: ['pending', 'in_review', 'verified', 'rejected'],
            default: 'pending',
        },
        kycDocuments: {
            passport: {
                number: String,
                expiryDate: Date,
                frontImage: String,
                backImage: String,
                uploadDate: Date,
                verificationStatus: {
                    type: String,
                    enum: ['pending', 'verified', 'rejected'],
                    default: 'pending',
                },
            },
            nationalId: {
                number: String,
                expiryDate: Date,
                frontImage: String,
                backImage: String,
                uploadDate: Date,
                verificationStatus: {
                    type: String,
                    enum: ['pending', 'verified', 'rejected'],
                    default: 'pending',
                },
            },
            studentCard: {
                number: String,
                university: String,
                expiryDate: Date,
                frontImage: String,
                backImage: String,
                uploadDate: Date,
                verificationStatus: {
                    type: String,
                    enum: ['pending', 'verified', 'rejected'],
                    default: 'pending',
                },
                verificationNotes: String,
            },
            selfieWithId: {
                image: String,
                uploadDate: Date,
                verificationStatus: {
                    type: String,
                    enum: ['pending', 'verified', 'rejected'],
                    default: 'pending',
                },
            },
        },
        
        // Student ID Verification
        studentVerification: {
            status: {
                type: String,
                enum: ['pending', 'in_review', 'verified', 'rejected'],
                default: 'pending',
            },
            studentId: String,
            university: String,
            studentCard: {
                frontImage: String,
                backImage: String,
                uploadDate: Date,
                verificationStatus: {
                    type: String,
                    enum: ['pending', 'verified', 'rejected'],
                    default: 'pending',
                },
            },
            enrollmentConfirmation: {
                document: String,
                uploadDate: Date,
                verificationStatus: {
                    type: String,
                    enum: ['pending', 'verified', 'rejected'],
                    default: 'pending',
                },
            },
            verificationDate: Date,
            verifiedBy: { type: Schema.Types.ObjectId, ref: 'User' },
            rejectionReason: String,
        },
        
        // Face Liveness Check
        faceVerification: {
            status: {
                type: String,
                enum: ['pending', 'completed', 'failed'],
                default: 'pending',
            },
            attempts: [{
                timestamp: Date,
                success: Boolean,
                confidence: Number,
                image: String,
                video: String,
                deviceInfo: {
                    deviceId: String,
                    platform: String,
                    browser: String,
                },
            }],
            lastAttempt: Date,
            bestConfidence: Number,
            completedAt: Date,
        },
        
        // Overall Verification Status
        verificationStatus: {
            type: String,
            enum: ['pending', 'partial', 'verified', 'rejected'],
            default: 'pending',
        },
        
        // Verification History
        verificationHistory: [{
            type: {
                type: String,
                enum: ['kyc', 'student', 'face'],
            },
            status: {
                type: String,
                enum: ['pending', 'verified', 'rejected'],
            },
            timestamp: Date,
            verifiedBy: { type: Schema.Types.ObjectId, ref: 'User' },
            notes: String,
        }],
        
        // Rejection Information
        rejectionInfo: {
            reason: String,
            timestamp: Date,
            rejectedBy: { type: Schema.Types.ObjectId, ref: 'User' },
            appealStatus: {
                type: String,
                enum: ['none', 'pending', 'approved', 'rejected'],
                default: 'none',
            },
            appealNotes: String,
        },
        
        deletedAt: { type: Date },
    },
    {
        timestamps: true,
        _id: true,
    }
)

// Create indexes for better query performance
userVerificationSchema.index({ userId: 1 })
userVerificationSchema.index({ verificationStatus: 1 })
userVerificationSchema.index({ 'kycStatus': 1 })
userVerificationSchema.index({ 'studentVerification.status': 1 })
userVerificationSchema.index({ 'faceVerification.status': 1 })

// Method to check if all verifications are complete
userVerificationSchema.methods.isFullyVerified = function() {
    return (
        this.kycStatus === 'verified' &&
        this.studentVerification.status === 'verified' &&
        this.faceVerification.status === 'completed' &&
        this.verificationStatus === 'verified'
    )
}

// Method to check if verification is rejected
userVerificationSchema.methods.isRejected = function() {
    return (
        this.kycStatus === 'rejected' ||
        this.studentVerification.status === 'rejected' ||
        this.verificationStatus === 'rejected'
    )
}

// Method to get verification progress
userVerificationSchema.methods.getVerificationProgress = function() {
    let completed = 0
    let total = 3

    if (this.kycStatus === 'verified') completed++
    if (this.studentVerification.status === 'verified') completed++
    if (this.faceVerification.status === 'completed') completed++

    return {
        completed,
        total,
        percentage: Math.round((completed / total) * 100),
    }
}

export default userVerificationSchema
