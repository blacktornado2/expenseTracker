const User = require("./../models/user.model");

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
  login: (req, res) => {
    console.log("login function called");
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
  updateProfile: (req, res) => {
    console.log("update function called");
  },
  deleteProfile: (req, res) => {
    console.log("delete function called");
  },
};
