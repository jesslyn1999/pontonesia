import mongoose from 'mongoose'
const Schema = mongoose.Schema

const userStudentSchema = new Schema(
    {
        _id: { type: Schema.Types.ObjectId, auto: true },
        userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        
        // Student Information
        studentType: {
            type: String,
            enum: ['phd', 'masters', 'bachelors', 'exchange', 'visiting'],
            required: true,
        },
        studentId: { type: String, required: true, unique: true },
        enrollmentYear: { type: Number, required: true },
        expectedGraduationYear: { type: Number },
        
        // Academic Information
        university: { type: String, required: true },
        department: { type: String, required: true },
        major: { type: String, required: true },
        researchField: { type: String }, // For PhD and Master's students
        supervisor: { type: String }, // Professor's name
        
        // Program Details
        programDuration: { type: Number }, // in years
        programLanguage: {
            type: String,
            enum: ['english', 'chinese', 'bilingual'],
            required: true,
        },
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
        visaNumber: { type: String },
        visaExpiryDate: { type: Date },
        
        // Accommodation
        dormitory: { type: String },
        roomNumber: { type: String },
        
        // Academic Status
        academicStatus: {
            type: String,
            enum: ['active', 'on_leave', 'graduated', 'suspended', 'withdrawn'],
            default: 'active',
        },
        currentSemester: { type: Number },
        gpa: { type: Number },
        
        // Additional Information
        researchInterests: [{ type: String }],
        publications: [{ type: String }],
        academicAwards: [{ type: String }],
        
        // Contact Information
        emergencyContact: {
            name: String,
            relationship: String,
            phone: String,
            email: String,
        },
        
        // Documents
        documents: [{
            type: { type: String },
            url: String,
            uploadDate: { type: Date, default: Date.now },
        }],
        
        deletedAt: { type: Date },
    },
    {
        timestamps: true,
        _id: true,
    }
)

// Create indexes for better query performance
userStudentSchema.index({ userId: 1 })
userStudentSchema.index({ studentId: 1 })
userStudentSchema.index({ university: 1 })
userStudentSchema.index({ department: 1 })
userStudentSchema.index({ studentType: 1 })
userStudentSchema.index({ academicStatus: 1 })

// Virtual for program progress
userStudentSchema.virtual('programProgress').get(function() {
    if (!this.enrollmentYear || !this.expectedGraduationYear) return null
    const currentYear = new Date().getFullYear()
    const totalDuration = this.expectedGraduationYear - this.enrollmentYear
    const completedYears = currentYear - this.enrollmentYear
    return Math.min(Math.round((completedYears / totalDuration) * 100), 100)
})

// Method to check if student is eligible for graduation
userStudentSchema.methods.isEligibleForGraduation = function() {
    const currentYear = new Date().getFullYear()
    return (
        this.academicStatus === 'active' &&
        this.gpa >= 3.0 &&
        currentYear >= this.expectedGraduationYear
    )
}

export default userStudentSchema 