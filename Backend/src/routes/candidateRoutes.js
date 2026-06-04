const express =
  require("express");

const {
  getCandidates,
} = require(
  "../controllers/candidateController"
);

const router =
  express.Router();

router.get(
  "/",
  getCandidates
);

module.exports =
  router;