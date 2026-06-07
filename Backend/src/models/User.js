const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const UserSchema = new mongoose.Schema(
  {
    employee_id: {
      type: String,
      required: true,
      unique: true, 
    },
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true, 
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
    },
    department: {
      type: String,
      required: true, 
    },
    role: {
      type: String,
      required: true, 
    },
    // ✨ NEW: Safely tracks and registers the official employee starting date
    joiningDate: {
      type: String,
      default: ""
    },
    // 👥 Holds dashboard group mappings safely
    team: {
      type: String,
      default: ""
    },
    // 📊 PROFILE DATA EXPANSION: Added to prevent data drops and the default "E" fallback
    phone: {
      type: String,
      default: ""
    },
    address: {
      type: String,
      default: ""
    },
    avatarUrl: {
      type: String,
      default: null // Stores your Base64 profile image string permanently
    }
  },
  { timestamps: true }
);

/// 🔒 Robust Hashing Guard: Prevents double-hashing loops during data modification
UserSchema.pre("save", async function () {
  // If the password field wasn't directly changed, skip hashing entirely!
  if (!this.isModified("password")) {
    return; // Just return to stop execution early
  }
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  } catch (error) {
    throw error; // Throwing an error inside an async hook correctly passes it to Mongoose
  }
});

// 🔑 Helper method to verify passwords during login requests
UserSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model("User", UserSchema);