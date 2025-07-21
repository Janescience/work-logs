// models/user.model.js (ตัวอย่าง)
import mongoose from 'mongoose'
import bcrypt from 'bcryptjs';

const UserSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    name: { 
        type: String,
        required: true,
    },
    phone: {
        type: String,
    },
    type: { 
        type: String, 
        enum: ['Non-Core', 'Core'], 
        default: 'Non-Core' 
    },
    roles: { // เก็บ Array ของ Role เช่น ['developer', 'admin']
        type: [String], // Array of Strings
        enum: ['DEVELOPER', 'TEAM LEAD','IT LEAD' ,'ADMIN'], // ยังคงจำกัด Role ที่ถูกต้อง
        default: ['DEVELOPER'] // Default ให้เป็น 'developer' หนึ่ง Role เมื่อสมัครสมาชิก
    },
    // สามารถเพิ่ม field อื่นๆ เช่น createdAt, updatedAt
    createdAt: {
        type: Date,
        default: Date.now
    }
});

UserSchema.pre('save', async function (next) {
    if (this.isModified('password')) {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
    }
    next();
});

module.exports = mongoose.models.User || mongoose.model('User', UserSchema);