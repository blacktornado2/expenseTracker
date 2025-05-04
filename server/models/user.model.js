const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  profilePicture: {
    type: String,
    required: false,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    match: /.+\@.+\..+/, // basic regex email validation
    trim: true,
  },
  password: {
    type: String,
    required: true,
    minLength: 6,
    maxLength: 20,
  },
  firstName: {
    type: String,
    required: true,
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

const User = mongoose.model("User", userSchema);

module.exports = User;
