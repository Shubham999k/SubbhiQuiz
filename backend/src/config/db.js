import mongoose from "mongoose";

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error connecting to MongoDB: ${error.message}`);
    console.log(
      "Ensure you have provided a valid MONGODB_URI in your .env file.",
    );
    // Do not exit the process here so that Socket.io can still run even if DB fails initially
  }
};

export default connectDB;
