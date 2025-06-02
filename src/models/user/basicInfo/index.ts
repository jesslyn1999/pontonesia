import mongoose from 'mongoose'


const Schema = mongoose.Schema

const UserBasicInfoSchema = new Schema(
    {
        _id: { type: Schema.Types.ObjectId, auto: true },
        firstName: { type: String, required: true },
        lastName: { type: String, required: true },
        email: { type: String, required: true, unique: true },
        username: { type: String, required: true, unique: true },
        // Authentication fields
        password: { type: String }, // Optional for Google SSO users
        authProvider: {
            type: String,
            enum: ['local', 'google'],
            default: 'local',
        },
        googleId: { type: String, sparse: true }, // Optional, only for Google SSO users
        // Profile fields
        avatar: { type: String },
        role: {
            type: String,
            enum: ['user', 'admin', 'moderator'],
            default: 'user',
        },
        status: {
            type: String,
            enum: ['active', 'inactive', 'suspended', 'banned'],
            default: 'active',
        },
        isEmailVerified: { type: Boolean, default: false },
        lastLoginAt: { type: Date },
        createdAt: { type: Date, default: Date.now },
        updatedAt: { type: Date, default: Date.now },
        deletedAt: { type: Date, default: Date.now },
    },
    {
        timestamps: true,
    }
)

// Create indexes for better query performance
UserBasicInfoSchema.index({ email: 1 })
UserBasicInfoSchema.index({ username: 1 })
UserBasicInfoSchema.index({ status: 1 })
UserBasicInfoSchema.index({ googleId: 1 }, { sparse: true })

// Virtual for full name
UserBasicInfoSchema.virtual('fullName').get(function() {
    return `${this.firstName} ${this.lastName}`
})

// Method to check if user is using Google SSO
UserBasicInfoSchema.methods.isGoogleUser = function() {
    return this.authProvider === 'google'
}

const UserBasicInfoModel = mongoose.model('UserBasicInfoModel', UserBasicInfoSchema);
export default UserBasicInfoModel;