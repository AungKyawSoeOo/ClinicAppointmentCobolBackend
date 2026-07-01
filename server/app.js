require("dotenv").config();
const express = require("express");
const cors = require("cors");
const authRoutes = require("./routes/user_auth");

const app = express();
app.use(cors({
    origin: 'http://localhost:4200'
}));
app.use(express.json());
app.use("/api", authRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log("Server running on http://localhost:3000");
});