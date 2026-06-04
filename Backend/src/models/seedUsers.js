require('dotenv').config({ path: './.env' });
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("./User"); // Adjust path to your User model if needed

// Your MongoDB connection string (replace with your actual local or Atlas URI)
const MONGO_URI = process.env.MONGO_URI; 
if (!MONGO_URI) {
    console.error("❌ Error: MONGO_URI is missing from your .env file!");
    process.exit(1);
  }

const seedUsers = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("🔄 Connected to MongoDB for seeding...");

    // Clear existing users so we don't duplicate
    await User.deleteMany({});
    console.log("🗑️ Cleared old users.");

    // Define one realistic test user for each of your 4 core hackathon roles
    const users = [
      {
        name: "Alex Admin",
        email: "admin@company.com",
        password: "password123",
        role: "Admin",
      },
      {
        name: "Sarah Manager",
        email: "manager@company.com",
        password: "password123",
        role: "Senior Manager",
      },
      {
        name: "Rachel Recruiter",
        email: "recruiter@company.com",
        password: "password123",
        role: "Recruiter",
      },
      {
        name: "Evan Employee",
        email: "employee@company.com",
        password: "password123",
        role: "Employee",
      },
    ];

    // Insert the new users (the pre-save hook in User.js will automatically hash their passwords!)
    await User.create(users);
    console.log("✅ Successfully seeded 4 corporate test users!");
    
    mongoose.connection.close();
    console.log("🔌 Database connection closed.");
  } catch (error) {
    console.error("❌ Error seeding database:", error);
    process.exit(1);
  }
};

seedUsers();