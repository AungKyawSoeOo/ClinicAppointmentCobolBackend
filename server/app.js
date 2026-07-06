const path = require('path');
require("dotenv").config({ path: path.join(__dirname, '../.env') });
const express = require("express");
const cors = require("cors");
const authRoutes = require("./routes/user_auth");
const locationRoutes = require("./routes/location");
const adminRoutes = require("./routes/admin");
const clinicRoutes = require("./routes/clinic");

const app = express();
app.use(cors({
    origin: 'http://localhost:4200'
}));
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.use("/api", authRoutes);
app.use("/api", locationRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api", clinicRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log("Server running on http://localhost:3000");
});