const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/user.model");
const Role = require("../models/role.model");
const Permission = require("../models/permission.model");
const e = require("express");


exports.getUsers = (req, res, next) => {
  const userQuery = User.find();

  userQuery
    .then(fetchedUsers => {
      const modifiedUsers = fetchedUsers.map(obj => {
        var user = {
          _id: obj._id,
          name: obj.name,
          username: obj.username,
          roleId: obj.roleId,
          __v: obj.__v
        }
        return user;
      });

      return modifiedUsers
    })
    .then(modifiedUsers => {
      res.status(200).json({
        message: "Users fetched successfully!",
        users: modifiedUsers
      });
    })
    .catch(error => {
      console.log(error);
      res.status(500).json({
        message: "Fetching users failed!"
      });
    });

};

exports.getUser = (req, res, next) => {
  User.findById(req.params.id)
    .then(user => {
      if (user) {
        res.status(200).json({
            _id: user._id,
            name: user.name,
            username: user.username,
            roleId: user.roleId,
            __v: user.__v
          });
      } else {
        res.status(404).json({ message: "User not found!" });
      }
    })
    .catch(error => {
      console.log(error);
      res.status(500).json({
        message: "Fetching user failed!"
      });
    });
};

exports.createUser = (req, res, next) => {

  bcrypt.hash(req.body.password, 10).then(hash => {
    const user = new User({
      name: req.body.name,
      username: req.body.username.toLowerCase(),
      password: hash,
      roleId: req.body.roleId,
    });

    user
      .save()
      .then(result => {
        res.status(201).json({
          message: "User created!",
          result: result
        });
      })
      .catch(error => {
        console.error(error.message);
        res.status(500).json({
          message: error.message
        });
      });
  });
};

exports.updateUser = (req, res, next) => {

  bcrypt.hash(req.body.password, 10).then(hash => {

    const user = {
      "_id": req.body.id,
      "name": req.body.name,
      "username": req.body.username.toLowerCase(),
      "roleId": req.body.roleId,
    };

    if (req.body.password != '') {
      user["password"] = hash;
    }

    console.log(user);

    User.updateOne({ _id: user._id }, {$set: user})
    .then(result => {
      console.log(result)
      if (result.n > 0) {
        res.status(200).json({ message: "Update successful!" });
      } else {
        res.status(401).json({ message: "Update failed!" });
      }
    })
    .catch(error => {
      console.error(error.message);
      res.status(500).json({
        message: error.message
      });
    });
  });
};

exports.deleteUser = (req, res, next) => {

  User.deleteOne({ _id: req.body.id })
    .then(result => {

      if (result.deletedCount > 0) {
        res.status(200).json({ message: "Deletion successful!" });
      } else {
        res.status(401).json({ message: "Deletion failed!" });
      }
    })
    .catch(error => {
      console.error(error.message);
      res.status(500).json({
        message: error.message
      });
    });
};
