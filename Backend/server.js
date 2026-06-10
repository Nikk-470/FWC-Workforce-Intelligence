const app = require("./src/app");
const mongoose = require("mongoose");
const connectDB =
  require("./src/config/db");

connectDB();

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});