const express = require("express");
const multer = require("multer");

const {
  uploadResume,
} = require("../controllers/resumeController");

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(
      null,
      Date.now() + "-" + file.originalname
    );
  },
});

const upload = multer({
  storage,
});

// 🟢 CHANGED: upload.single("resume") ➡️ upload.array("resume", 15)
// This lets you upload up to 15 PDFs at the exact same time!
router.post(
  "/upload",
  upload.array("resume", 15), 
  uploadResume
);

module.exports = router;