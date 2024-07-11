const path = require("path");
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const dotenv = require("dotenv");

dotenv.config(); // Load environment variables from .env file

const rolesRoutes = require("./routes/roles.route");
const permissionsRoutes = require("./routes/permissions.route");
const usersRoutes = require("./routes/users.route");
const deepFakeRoutes = require("./routes/deep-fake.route");
const fileUploadRoutes = require("./routes/file-upload.route");
const authRoutes = require("./routes/auth.route");

const app = express();

const mongoUrl = process.env.MONGODB_URL || "mongodb://localhost:27017";

mongoose.set('strictQuery', false);
mongoose
  .connect(
      mongoUrl, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      useCreateIndex: true
    }
  )
  .then(() => {
    console.log(`Database at:\t ${mongoUrl}`);
  })
  .catch((error) => {
    console.log(error);
    console.log("Connection failed!");
  });

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use("/", express.static(path.join(__dirname, "angular")));

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PATCH, PUT, DELETE, OPTIONS"
  );
  res.setHeader("Access-Control-Allow-Credentials", "true");
  next();
});

app.use("/api/roles", rolesRoutes);
app.use("/api/permissions", permissionsRoutes);
app.use("/api/users", usersRoutes);
app.use("/api/file-upload", fileUploadRoutes);
app.use("/api/deep-fake", deepFakeRoutes);
app.use("/api/auth", authRoutes);
app.use((req, res, next) => {
  res.sendFile(path.join(__dirname, "angular", "index.html"));
});

module.exports = app;
