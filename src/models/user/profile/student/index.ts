import mongoose from 'mongoose'
const Schema = mongoose.Schema

const userProfileStudentSchema = new Schema(
    {
        _id: { type: Schema.Types.ObjectId, auto: true },
        userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        
        // Student Information
        studentType: {
            type: String,
            enum: ['phd', 'masters', 'bachelors', 'exchange', 'visiting', 'others'],
            required: true,
        },
        studentTypeOther: { type: String },

        studentId: { type: String, required: true, unique: true },
        enrollmentYear: { type: Number, required: true },
        expectedGraduationYear: { type: Number },
        
        // Academic Information
        university: { type: String, required: true },
        department: { type: String, required: true },
        major: { type: String, required: true },
        
        // Program Details
        programDuration: { type: Number }, // in years
        degreeType: {
            type: String,
            enum: ['academic', 'professional', 'research'],
            required: true,
        },
        
        // Scholarship Information
        scholarship: {
            type: String,
            enum: ['csc', 'university', 'provincial', 'other', 'none'],
            default: 'none',
        },
        scholarshipDetails: { type: String },
        
        // Visa Information
        visaType: { type: String },
        visaExpiryDate: { type: Date },
        
        // Additional Information
        researchInterests: [{ type: String }],
        
        // Contact Information
        emergencyContact: {
            name: String,
            relationship: String,
            phone: String,
            email: String,
        },
        
        // Documents. Ex: student card, passport, etc.
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
userProfileStudentSchema.index({ userId: 1 })
userProfileStudentSchema.index({ studentId: 1 })
userProfileStudentSchema.index({ university: 1 })
userProfileStudentSchema.index({ department: 1 })
userProfileStudentSchema.index({ studentType: 1 })
userProfileStudentSchema.index({ academicStatus: 1 })

// Virtual for program progress
userProfileStudentSchema.virtual('programProgress').get(function() {
    if (!this.enrollmentYear || !this.expectedGraduationYear) return null
    const currentYear = new Date().getFullYear()
    const totalDuration = this.expectedGraduationYear - this.enrollmentYear
    const completedYears = currentYear - this.enrollmentYear
    return Math.min(Math.round((completedYears / totalDuration) * 100), 100)
})


export default userProfileStudentSchema;