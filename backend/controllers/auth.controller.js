const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Role = require("../models/role.model");
const User = require("../models/user.model");
const e = require("express");

exports.userLogin = async (req, res, next) => {
  try {
    let fetchedUser;

    // Check if there are any users in the database
    const userCount = await User.countDocuments();
    if (userCount === 0) {
      const targetRole = "المسؤول";
      // Check if the "super admin" role exists
      let superAdminRole = await Role.findOne({ role: targetRole });
      if (!superAdminRole) {
        // Create the "super admin" role if it doesn't exist
        superAdminRole = new Role({
          role: targetRole,
          permissions: ["all"] // Adjust permissions as needed
        });
        await superAdminRole.save();
      }

      // Create an admin user if no users exist
      const hashedPassword = await bcrypt.hash("admin", 10);
      const adminUser = new User({
        name: targetRole,
        username: "admin",
        password: hashedPassword,
        roleId: superAdminRole._id, // Assign the super admin role's ID
      });
      await adminUser.save();
    }

    // Find the user by username
    const user = await User.findOne({ username: req.body.username.toLowerCase() });
    if (!user) {
      return res.status(401).json({
        message: "Auth failed"
      });
    }
    fetchedUser = user;

    // Compare the password
    const result = await bcrypt.compare(req.body.password, user.password);
    if (!result) {
      return res.status(401).json({
        message: "Auth failed"
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { username: fetchedUser.username, userId: fetchedUser._id },
      process.env.JWT_KEY,
      { expiresIn: "24h" }
    );
    res.status(200).json({
      token: token,
      expiresIn: 24 * 60 * 60,
      userId: fetchedUser._id,
    });
  } catch (err) {
    console.log(err);
    return res.status(401).json({
      message: "Invalid authentication credentials!"
    });
  }
};
