const express = require("express");
const mysql = require("mysql");
const cors = require("cors");  // <-- Import CORS
const bodyParser = require("body-parser");
const jwt = require("jsonwebtoken"); // Import JWT for authentication

const app = express();
app.use(cors());  // <-- Enable CORS globally
app.use(bodyParser.json());


// Secret Key for JWT Token
const SECRET_KEY = "hasanbuttarskey"; // Change this to a secure key

// Hardcoded username and password
const ADMIN_USERNAME = "admin";
const ADMIN_PASSWORD = "Pakistan22"; // Change this!
// MySQL Connection
const db = mysql.createConnection({
    host: "localhost",
    user: "hasan",
    password: "Pakistan@22--",
    database: "visitor_logs"
});
db.connect(err => {
    if (err) throw err;
    console.log("MySQL Connected...");
});
// API to handle login
app.post("/api/login", (req, res) => {
    const { username, password } = req.body;

    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
        const token = jwt.sign({ username }, SECRET_KEY, { expiresIn: "1h" });
        res.json({ status: "success", token });
    } else {
        res.status(401).json({ status: "error", message: "Invalid credentials" });
    }
});

// Middleware to verify JWT token
const verifyToken = (req, res, next) => {
    const token = req.headers["authorization"];
    if (!token) return res.status(403).json({ status: "error", message: "Unauthorized" });

    jwt.verify(token.split(" ")[1], SECRET_KEY, (err, decoded) => {
        if (err) return res.status(403).json({ status: "error", message: "Invalid token" });
        req.user = decoded;
        next();
    });
};

// API to receive visitor data
app.post("/api/updateprofile", (req, res) => {
    const { ip, city, region, country, latitude, longitude, isp, timezone, userAgent, referrer, screenWidth, screenHeight } = req.body;

    // Log request data for debugging
    console.log("Visitor Data Received:", req.body);

    const sql = `INSERT INTO visitors (ip, city, region, country, latitude, longitude, isp, timezone, user_agent, referrer, screen_width, screen_height) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

    db.query(sql, [ip, city, region, country, latitude, longitude, isp, timezone, userAgent, referrer, screenWidth, screenHeight], (err, result) => {
        if (err) {
            console.error("Database Error:", err);
            return res.status(500).json({ status: "error", message: "Database error" });
        }
        res.json({ status: "success" });
    });
});
// API to get visitor logs (Protected)
app.get("/api/getprofiles", verifyToken, (req, res) => {
    const sql = "SELECT id, ip, city, region, country, latitude, longitude, isp, timezone, user_agent, referrer, screen_width, screen_height, visit_time FROM visitors ORDER BY visit_time DESC";
    db.query(sql, (err, results) => {
        if (err) {
            console.error("Database error:", err);
            res.status(500).json({ status: "error", message: "Database error" });
        } else {
            res.json(results);
        }
    });
});

// Serve static files (dashboard.html should be protected)
app.use(express.static("/var/www/mywebsite"));

// Protect dashboard.html with token authentication
app.get("/dashboard.html", (req, res) => {
    res.sendFile("/var/www/mywebsite/dashboard.html", { root: __dirname });
});
// Start server
app.listen(3000, () => console.log("Server running on port 3000"));
