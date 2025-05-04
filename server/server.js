require("dotenv").config();
const app = require("./app");
const connectDB = require("./config/db");

const MONGODB_CONNECTION_URI_STAGING = process.env.MONGODB_CONNECTION_URI_TEST;

connectDB(MONGODB_CONNECTION_URI_STAGING);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
