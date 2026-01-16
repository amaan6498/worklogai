import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    mongoose.set('strictQuery', false);

    await mongoose.connect(process.env.MONGO_URI);

    console.log('MongoDB connected');
  } catch (err) {
    console.error('MongoDB connection failed');
    console.error('Name:', err.name);
    console.error('Message:', err.message);
    console.error('Code:', err.code);
    console.error(err);
    process.exit(1);
  }
};

export default connectDB;
