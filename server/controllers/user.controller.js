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
