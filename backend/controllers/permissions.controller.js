const Permission = require("../models/permission.model");

exports.getPermissions = (req, res, next) => {

  const permissionQuery = Permission.find();

  permissionQuery
    .then(fetchedPermissions => {
      res.status(200).json({
        message: "Permissions fetched successfully!",
        permissions: fetchedPermissions
      });
    })
    .catch(error => {
      console.log(error);
      res.status(500).json({
        message: "Fetching permissions failed!"
      });
    });

};

exports.getPermission = (req, res, next) => {
  Permission.findById(req.params.id)
    .then(permission => {
      if (permission) {
        res.status(200).json(permission);
      } else {
        res.status(404).json({ message: "Permission not found!" });
      }
    })
    .catch(error => {
      console.log(error);
      res.status(500).json({
        message: "Fetching permission failed!"
      });
    });
};

exports.createPermission = (req, res, next) => {

  const permission = new Permission({
    permission: req.body.permission,
  });
  permission
    .save()
    .then(createdPermission => {
      res.status(201).json({
        message: "Permission added successfully",
        permission: {
          ...createdPermission,
          id: createdPermission._id
        }
      });
    })
    .catch(error => {
      console.log(error);
      res.status(500).json({
        message: "Creating a permission failed!"
      });
    });

};

exports.updatePermission = (req, res, next) => {

  const permission = new Permission({
    _id: req.body.id,
    permission: req.body.permission
  });

  Permission.updateOne({ _id: permission._id }, permission)
    .then(result => {
      if (result.n > 0) {
        res.status(200).json({ message: "Update successful!" });
      } else {
        res.status(401).json({ message: "Update failed!" });
      }
    })
    .catch(error => {
      console.log(error);
      res.status(500).json({
        message: "Couldn't udpate permission!"
      });
    });
};

exports.deletePermission = (req, res, next) => {

  Permission.deleteOne({ _id: req.body.id })
    .then(result => {
      if (result.deletedCount > 0) {
        res.status(200).json({ message: "Deletion successful!" });
      } else {
        res.status(401).json({ message: "Deletion failed!" });
      }
    })
    .catch(error => {
      console.log(error);
      res.status(500).json({
        message: "Deleting permission failed!"
      });
    });
};
