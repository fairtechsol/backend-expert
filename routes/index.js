const express = require("express");
const router = express.Router();

// Import route modules
const authRoutes = require("./authRoutes");
const userRoutes = require("./userRoutes");
const matchRoutes = require("./matchRouter");
const superAdminRoutes = require("./superAdminRouter");

router.use("/auth", authRoutes);
router.use("/user", userRoutes);
router.use("/match", matchRoutes);
router.use("/superAdmin", superAdminRoutes);
module.exports = router;
