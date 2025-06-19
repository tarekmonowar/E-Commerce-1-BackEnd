import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();
const mongoURL = process.env.DB_URL;
const connectDB = async () => {
    try {
        if (!mongoURL) {
            throw new Error("DB_URL is not defined in environment variables");
        }
        await mongoose.connect(mongoURL);
        console.log("Mongo DB Connected Successfully");
    }
    catch (error) {
        console.error("Failed to Connect Mongo DB", error.message);
    }
};
export default connectDB;
