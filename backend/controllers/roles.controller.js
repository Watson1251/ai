const Role = require("../models/role.model");

exports.getRoles = (req, res, next) => {

  const roleQuery = Role.find();

  roleQuery
    .then(fetchedRoles => {
      res.status(200).json({
        message: "Roles fetched successfully!",
        roles: fetchedRoles
      });
    })
    .catch(error => {
      console.error(error.message);
      res.status(500).json({
        message: error.message
      });
    });

};

exports.createRole = (req, res, next) => {

  const role = new Role({
    role: req.body.role,
    permissions: req.body.permissions.map(object => object.id)
  });

  role
    .save()
    .then(createdRole => {
      res.status(201).json({
        message: "Role added successfully",
        role: {
          ...createdRole,
          id: createdRole._id
        }
      });
    })
    .catch(error => {
      console.error(error.message);
      res.status(500).json({
        message: error.message
      });
    });

};

exports.updateRole = (req, res, next) => {

  const role = new Role({
    _id: req.body.id,
    role: req.body.role,
    permissions: req.body.permissions.map(object => object.id)
  });

  Role.updateOne({ _id: role._id }, role)
    .then(result => {
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
};

exports.deleteRole = (req, res, next) => {

  Role.deleteOne({ _id: req.body.id })
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
