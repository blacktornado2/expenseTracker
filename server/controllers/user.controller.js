const User = require("./../models/user.model");
const jwt = require("jsonwebtoken");

module.exports = {
  register: async (req, res) => {
    console.log("register function called");

    try {
      const { email } = req.body;
      const isUserExists = await User.find({ email });

      if (isUserExists.length) {
        return res.status(400).json({ message: "User already exists" });
      }

      const { firstName, lastName, password, dob, gender } = req.body;
      const newUser = new User({
        firstName,
        lastName,
        email,
        password,
        dob,
        gender,
      });
      await newUser.save();

      return res.status(201).json({
        message: "User created successfully",
        user: {
          id: newUser._id,
          firstName: newUser.firstName,
          lastName: newUser.lastName,
          email: newUser.email,
          dob: newUser.dob,
        },
      });
    } catch (error) {
      console.error("Error in register function:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  },
  login: async (req, res) => {
    console.log("login function called");
    const { email, password } = req.body;

    try {
      // 1. Check if user exists
      let user = await User.findOne({ email });
      if (!user) {
        return res
          .status(400)
          .json({ errors: [{ msg: "Invalid credentials" }] });
      }

      // 2. Compare password
      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        return res
          .status(400)
          .json({ errors: [{ msg: "Invalid credentials" }] }); // Use generic message for security
      }

      // 3. User matched, create JWT Payload(will be used to create token)
      const payload = {
        user: {
          id: user._id, // or user._id depending on your preference
          email: user.email,
          // Add any other user data you want in the token
          // Be mindful of token size and sensitive information
        },
      };

      // 4. Sign the token
      jwt.sign(
        payload,
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || "1h" },
        (err, token) => {
          if (err) throw err;
          return res.status(200).json({
            status: "Success",
            message: "Login successful!",
            token: token, // Send the token to the client
            user: {
              // Optionally send some user details back
              id: user._id,
              email: user.email,
            },
          });
        }
      );
    } catch (error) {
      console.error("Error in login function:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  },
  getProfile: async (req, res) => {
    console.log("getProfile function called");

    try {
      const { email } = req.params;

      const user = await User.find({ email });

      if (!user.length) {
        return res.status(404).json({ message: "User not found" });
      }

      return res.status(200).json(user[0]);
    } catch (error) {
      console.error("Error in getProfile function:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  },
  updateProfile: async (req, res) => {
    console.log("update function called");
    const { email } = req.params;
    try {
      const user = await User.findOneAndUpdate(
        { email },
        { ...req.body },
        { new: true, runValidators: true }
      );

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      return res.status(200).json({
        status: "Success",
        message: "User updated successfully",
        user,
      });
    } catch (error) {
      console.error("Error in updateProfile function:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  },
  deleteProfile: async (req, res) => {
    console.log("delete function called");

    try {
      const { email } = req.params;
      const result = await User.deleteOne({ email });

      if (result.deletedCount === 0) {
        return res
          .status(200)
          .json({ status: "Success", message: "User not found" });
      }

      return res
        .status(200)
        .json({ status: "Success", message: "User deleted successfully" });
    } catch (error) {
      console.error("Error in deleteProfile function:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  },
};
