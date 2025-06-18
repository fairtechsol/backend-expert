const express = require("express");
const router = express.Router();

// Import route modules
const authRoutes = require("./authRoutes");
const userRoutes = require("./userRoutes");
const matchRoutes = require("./matchRouter");
const sessionRoute = require("./sessionRoutes");
const generalRoute = require("./generalRoute");
const matchBettingRoute = require('./matchBettingRoutes');
const betRoutes = require('./betRoutes');
const blinkingTabsRoutes = require('./blinkingTabRouter');

router.use("/auth", authRoutes
// #swagger.tags = ['auth']
);
router.use("/user", userRoutes
// #swagger.tags = ['user']
);
router.use("/match", matchRoutes
// #swagger.tags = ['match']
);

router.use('/session',sessionRoute
// #swagger.tags = ['session']
);
router.use('/general', generalRoute
// #swagger.tags = ['general']
);
router.use('/matchBeting', matchBettingRoute
// #swagger.tags = ['Match betting']
);
router.use('/bet', betRoutes
// #swagger.tags = ['bet']

);

router.use('/blinkingTabs', blinkingTabsRoutes
    // #swagger.tags = ['blinking Tabs']
    
    );
module.exports = router;
