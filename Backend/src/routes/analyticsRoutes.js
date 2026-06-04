const express =
require("express");

const {
  getRecruiterAnalytics,
} = require(
  "../controllers/analyticsController"
);

const router =
  express.Router();

router.get(
  "/recruiter",
  getRecruiterAnalytics
);

module.exports =
  router;