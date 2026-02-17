import dotenv from "dotenv";
dotenv.config();

import app from "./app.js";
import connectDB from "./config/db.js";

const requiredEnvVars = [
  'MONGO_URI',
  'JWT_SECRET',
  // Add other required vars e.g. 'HF_ACCESS_TOKEN'
];

requiredEnvVars.forEach((key) => {
  if (!process.env[key]) {
    console.error(`FATAL ERROR: ${key} is not defined.`);
    process.exit(1);
  }
});

connectDB();

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
