const express = require("express");

const {
  chatWithFWCAI,
} = require("../controllers/aiController");

const router = express.Router();

router.post("/", chatWithFWCAI);

module.exports = router;