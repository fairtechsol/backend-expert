const express = require("express");
const router = express.Router();

// Import route modules
const authRoutes = require("./authRoutes");
const userRoutes = require("./userRoutes");
const matchRoutes = require("./matchRouter");
const superAdminRoutes = require("./superAdminRouter");
const sessionRoute = require("./sessionRoutes");
const generalRoute = require("./generalRoute");
const matchBettingRoute = require('./matchBettingRoutes');
const betRoutes = require('./betRoutes');

router.use("/auth", authRoutes);
router.use("/user", userRoutes);
router.use("/match", matchRoutes);
router.use("/superAdmin", superAdminRoutes);
router.use('/session',sessionRoute);
router.use('/general', generalRoute);
router.use('/matchBeting', matchBettingRoute);
router.use('/bet', betRoutes);

module.exports = router;
