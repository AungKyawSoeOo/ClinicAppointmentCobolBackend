const path = require('path');
require("dotenv").config({ path: path.join(__dirname, '../.env') });
const express = require("express");
const cors = require("cors");
const authRoutes = require("./routes/user_auth");
const locationRoutes = require("./routes/location");

const app = express();
app.use(cors({
    origin: 'http://localhost:4200'
}));
app.use(express.json());
app.use("/api", authRoutes);
app.use("/api", locationRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log("Server running on http://localhost:3000");
});