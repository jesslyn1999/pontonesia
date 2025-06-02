import mongoose from 'mongoose'
const Schema = mongoose.Schema

const userProfileGeneralSchema = new Schema(
    {
        _id: { type: Schema.Types.ObjectId, auto: true },
        userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        
        // Personal Information
        nationality: { type: String, required: true },
        dateOfBirth: { type: Date, required: true },
        gender: {
            type: String,
            enum: ['male', 'female', 'other', 'prefer_not_to_say'],
            required: true,
        },

        // Contact Information
        email: { 
            type: String, 
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
        },
        phone: {
            number: { type: String },
            countryCode: { type: String },
            isVerified: { type: Boolean, default: false },
        },
        alternativeEmail: { 
            type: String,
            lowercase: true,
            trim: true,
        },

        // Language Proficiency
        languages: [{
            language: String,
            proficiency: {
                type: String,
                enum: ['beginner', 'intermediate', 'advanced', 'native'],
            },
            isNative: Boolean,
        }],
        
        // Location Information
        currentLocation: {
            country: String,
            city: String,
            address: String,
            postalCode: String,
        },
        
        // Additional Information
        bio: { type: String },
        profilePicture: { type: String },
        coverPhoto: { type: String },
        
        // Privacy Settings
        privacySettings: {
            showEmail: { type: Boolean, default: false },
            showPhone: { type: Boolean, default: false },
            showLocation: { type: Boolean, default: true },
        },
        
        // Documents
        documents: [{
            type: { type: String },
            url: String,
            uploadDate: { type: Date, default: Date.now },
        }],
        
        createdAt: { type: Date, default: Date.now },
        updatedAt: { type: Date, default: Date.now },
        deletedAt: { type: Date, default: Date.now },
    },
    {
        timestamps: true,
        _id: true,
    }
)

// Create indexes for better query performance
userProfileGeneralSchema.index({ userId: 1 })
userProfileGeneralSchema.index({ nationality: 1 })
userProfileGeneralSchema.index({ email: 1 })
userProfileGeneralSchema.index({ 'phone.number': 1 })
userProfileGeneralSchema.index({ 'currentLocation.country': 1 })
userProfileGeneralSchema.index({ 'currentLocation.city': 1 })

// Virtual for age calculation
userProfileGeneralSchema.virtual('age').get(function() {
    if (!this.dateOfBirth) return null
    const today = new Date()
    let age = today.getFullYear() - this.dateOfBirth.getFullYear()
    const monthDiff = today.getMonth() - this.dateOfBirth.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < this.dateOfBirth.getDate())) {
        age--
    }
    return age
})

// Method to check if profile is complete
userProfileGeneralSchema.methods.isProfileComplete = function() {
    return (
        this.nationality &&
        this.dateOfBirth &&
        this.gender &&
        this.email &&
        this.phone.number &&
        this.currentLocation.country &&
        this.currentLocation.city
    )
}

export default userProfileGeneralSchema 