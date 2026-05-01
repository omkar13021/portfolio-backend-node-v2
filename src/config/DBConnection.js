import mongoose from 'mongoose';
import env from 'dotenv';

env.config();
const connectionString = process.env.MONGODB_URL;

const DBConnect = async () => {
    try {
        const connect = await mongoose.connect(connectionString);
        console.log("sucessfully connected to Database:", connect.connection.name);
    } catch (error) {
        console.log(error);
        process.exit(1);
    }
}

export default DBConnect;