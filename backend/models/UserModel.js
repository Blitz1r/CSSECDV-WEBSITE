const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { 
        type: String, 
        enum: ['Administrator', 'Manager', 'Guest'], 
        default: 'Guest', 
        required: true 
    }
}, { timestamps: true });

// Hash password if modified and not already hashed
userSchema.pre('save', async function (next) {
    if (this.isModified('password') && !this.password.startsWith('$2')) {
        try {
            this.password = await bcrypt.hash(this.password, 10);
        } catch (err) {
            return next(err);
        }
    }
    next();
});

const User = mongoose.model('User', userSchema);
module.exports = User;

// NOTE: Seeding should be performed via a dedicated script, not on every model load.
