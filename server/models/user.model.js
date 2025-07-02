const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema({
  profilePicture: {
    type: String,
    required: false,
  },
  email: {
    type: String,
    required: [true, "Email is required"],
    unique: true,
    match: [/.+\@.+\..+/, "Please enter a valid email address"], // basic regex email validation
    trim: true,
  },
  password: {
    type: String,
    required: [true, "Password is required"],
    minLength: 6,
    maxLength: 20,
  },
  firstName: {
    type: String,
    required: [true, "First name is required"],
    minLength: 3,
    maxLength: 30,
    trim: true,
  },
  lastName: {
    type: String,
    minLength: 3,
    maxLength: 30,
    required: false,
    trim: true,
  },
  dob: {
    type: Date,
    required: false,
  },
  gender: {
    type: String,
    required: false,
    enum: ["male", "female"],
  },
});

// Hash password before saving
userSchema.pre("save", async function (next) {
  // If the password is not modified, skip hashing
  // This is important to avoid hashing the password again if the user updates other fields
  if (!this.isModified("password")) {
    return next();
  }

  // Generate a salt and hash the password
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Method to compare entered password with hashed password
userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model("User", userSchema);

module.exports = User;
