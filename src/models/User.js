import mongoose from "mongoose";

const schema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, trim: true },
    password: { type: String, required: true, trim: true },
    role: { type: String, required: true, enum: ['user', 'admin', 'super-admin'], default: 'user' }
}, { timestamps: true });

const User = mongoose.model('User', schema);

export default User;
