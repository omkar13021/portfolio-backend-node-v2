import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    name: {
        type    : String,
        required: true,
        trim    : true,
    },
    email: {
        type    : String,
        required: true,
        unique  : true,   // Enforced at DB level
        trim    : true,
        lowercase: true,
        index   : true,
    },
    password: {
        type    : String,
        required: true,
        select  : false,  // Never returned by default — use .select('+password') to opt-in
    },
    role: {
        type   : String,
        required: true,
        enum   : ['user', 'admin', 'super-admin'],
        default: 'user',
    },
}, { timestamps: true });

const User = mongoose.model('User', userSchema);

export default User;
