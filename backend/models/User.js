const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const DEPARTMENTS = require('../config/departments');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true
    },
    passwordHash: {
        type: String,
        required: true
    },
    role: {
        type: String,
        enum: ['admin', 'tutor', 'student'],
        required: true
    },
    department: {
        type: String,
        enum: DEPARTMENTS,
        required: function () {
            return this.role !== 'admin';
        }
    },
    assignedTutorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    photoUrl: String,
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Hash password before saving
userSchema.pre('save', async function (next) {
    if (!this.isModified('passwordHash')) return next();

    try {
        const salt = await bcrypt.genSalt(12);
        this.passwordHash = await bcrypt.hash(this.passwordHash, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.passwordHash);
};

module.exports = mongoose.model('User', userSchema);