const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const { validatePassword } = require('../utils/passwordPolicy');

const PASSWORD_HISTORY_LIMIT = parseInt(process.env.PASSWORD_HISTORY_LIMIT || '5', 10);
const MIN_PASSWORD_AGE_HOURS = parseInt(process.env.MIN_PASSWORD_AGE_HOURS || '24', 10);

const userSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true, validate: {
            validator: function(value) {
                // If the password is already hashed (starts with $2b$...), skip validation
                if (value.startsWith('$2b$')) return true;

                // Otherwise, check for complexity
                return /^(?=.*[0-9])(?=.*[!@#$%^&*])/.test(value);
            },
            message: 'Password must contain at least one number and one special character.'
        }, minlength: [6, 'Password must at least be 6 characters'] },
    // Stores previous password hashes (most recent first, excluding current if desired)
    passwordHistory: { type: [String], default: [] },
    role: {
        type: String,
        enum: ['Administrator', 'Manager', 'Guest'],
        default: 'Guest',
        required: true
    },
    securityQuestion: { type: String, required: true, default:'What is your Fav hiking trail?'},
    securityAnswer: { type: String, required: true },
    failedLoginAttempts: { type: Number, default: 0 },
    lockUntil: { type: Date, default: null },
    lastPasswordChange: { type: Date, default: null },
    lastUseAt: { type: Date, default: null }, // last successful or failed attempt
    lastSuccessfulLoginAt: { type: Date, default: null },
    lastFailedLoginAt: { type: Date, default: null }
}, { timestamps: true });

// Helper to check if account is currently locked
userSchema.methods.isLocked = function() {
    return !!(this.lockUntil && this.lockUntil.getTime() > Date.now());
};

// Hash password if modified and not already hashed
userSchema.pre('save', async function (next) {
    if (this.isModified('password') && !this.password.startsWith('$2')) {
        const check = validatePassword(this.password);
        if (!check.valid) {
            return next(new Error(check.errors.join('; ')));
        }
        try {
            const hashed = await bcrypt.hash(this.password, 10);
            // If existing current password was hashed and not in history, push it before replacement
            if (this.isModified('password') && this.passwordHistory && this.passwordHistory.length > 0) {
                // No action needed here; history maintenance occurs on explicit reset.
            }
            this.password = hashed;
            // Ensure current hashed password is tracked for future reuse prevention
            if (!this.passwordHistory) {
                this.passwordHistory = [];
            }
            if (!this.passwordHistory.includes(hashed)) {
                this.passwordHistory.unshift(hashed);
            }
            // Trim history to limit
            if (this.passwordHistory.length > PASSWORD_HISTORY_LIMIT) {
                this.passwordHistory = this.passwordHistory.slice(0, PASSWORD_HISTORY_LIMIT);
            }
            this.lastPasswordChange = new Date();
        } catch (err) {
            return next(err);
        }
    }
    next();
});

// Check if a candidate plain password matches any stored previous hash
userSchema.methods.isPasswordReused = async function (candidate) {
    const hashesToCheck = [];
    if (this.password && this.password.startsWith('$2')) {
        hashesToCheck.push(this.password);
    }
    if (Array.isArray(this.passwordHistory)) {
        for (const h of this.passwordHistory) {
            if (h && h.startsWith('$2')) {
                hashesToCheck.push(h);
            }
        }
    }
    for (const oldHash of hashesToCheck) {
        try {
            const match = await bcrypt.compare(candidate, oldHash);
            if (match) return true;
        } catch (_) { /* ignore compare errors */ }
    }
    return false;
};

userSchema.methods.canChangePassword = function () {
    if (!this.lastPasswordChange) return true;
    const ageMs = Date.now() - this.lastPasswordChange.getTime();
    return ageMs >= MIN_PASSWORD_AGE_HOURS * 3600000;
};

userSchema.methods.passwordAgeRemainingMinutes = function () {
    if (!this.lastPasswordChange) return 0;
    const ageMs = Date.now() - this.lastPasswordChange.getTime();
    const requiredMs = MIN_PASSWORD_AGE_HOURS * 3600000;
    if (ageMs >= requiredMs) return 0;
    return Math.ceil((requiredMs - ageMs) / 60000);
};

const User = mongoose.model('User', userSchema);
module.exports = User;

// NOTE: Seeding should be performed via a dedicated script, not on every model load.
