require('dotenv').config({ path: './.env' });
const mongoose = require("mongoose");
const User = require("./User"); // Adjust path if needed

const MONGO_URI = process.env.MONGO_URI; 
if (!MONGO_URI) {
  console.error("❌ Error: MONGO_URI is missing from your .env file!");
  process.exit(1);
}

const seedUsers = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("🔄 Connected to MongoDB for seeding...");

    // Clear existing accounts to prevent duplicate errors
    await User.deleteMany({});
    console.log("🗑️ Cleared old users.");

    // 1. Core user blueprints with explicitly assigned departments
    const userBlueprints = [
      {
        name: "Alex Admin",
        email: "admin@company.com",
        password: "password123",
        role: "Admin",
        department: "Administration"
      },
      {
        name: "Sarah Manager",
        email: "manager@company.com",
        password: "password123",
        role: "Senior Manager",
        department: "Engineering"
      },
      {
        name: "Rachel Recruiter",
        email: "recruiter@company.com",
        password: "password123",
        role: "Recruiter",
        department: "Human Resources"
      },
      {
        name: "Evan Employee",
        email: "employee@company.com",
        password: "password123",
        role: "Employee",
        department: "Engineering"
      },
    ];

    // 2. Track incremental sequence counts inside an tracking map object
    const departmentCounts = {};
    const finalizedUsers = [];

    for (const user of userBlueprints) {
      const dept = user.department;
      
      // Initialize or increment count for the department
      departmentCounts[dept] = (departmentCounts[dept] || 0) + 1;
      
      // Calculate prefix (first 3 letters uppercase) and pad the tracking sequence number
      const prefix = dept.trim().substring(0, 3).toUpperCase();
      const paddedNum = String(departmentCounts[dept]).padStart(3, "0");
      
      // Inject the calculated property right onto the user object array index
      finalizedUsers.push({
        ...user,
        employee_id: `${prefix}${paddedNum}`, // Generates e.g. ADM001, ENG001, HUM001, ENG002
        team: "" // Initialized blank for your Senior Manager portal allocations!
      });
    }

    // 3. Save directly to MongoDB (Triggers your User.js pre-save bcrypt hook safely!)
    await User.create(finalizedUsers);
    console.log("✅ Successfully seeded 4 schema-compliant corporate test users!");
    
    console.log("📋 Generated Seed Profiles summary:");
    finalizedUsers.forEach(u => console.log(`👉 ID: ${u.employee_id} | ${u.name} (${u.role}) -> Dept: ${u.department}`));

    mongoose.connection.close();
    console.log("🔌 Database connection closed.");
  } catch (error) {
    console.error("❌ Error seeding database:", error);
    process.exit(1);
  }
};

seedUsers();