const express = require("express");
const session = require("express-session");
const bcrypt = require("bcryptjs");
const fs = require("fs").promises;
const fsSync = require("fs");
const path = require("path");
const crypto = require("crypto");
const multer = require("multer");

const app = express();
const PORT = process.env.PORT || 8080;
const isProduction = process.env.NODE_ENV === "production";

app.set('trust proxy', 1);

const DATA_FILE = path.join(__dirname, "data.json");
const PUBLIC_DIR = path.join(__dirname, "public");
const UPLOADS_DIR = path.join(PUBLIC_DIR, "uploads");

// Ensure uploads directory exists
if (!fsSync.existsSync(UPLOADS_DIR)) {
    fsSync.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Multer storage config for local/railway uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, UPLOADS_DIR);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
    session({
        secret: process.env.SESSION_SECRET || "hassan-fitness-local-secret-2026",
        resave: false,
        saveUninitialized: false,
        cookie: {
            httpOnly: true,
            secure: isProduction,
            sameSite: "lax",
            maxAge: 24 * 60 * 60 * 1000
        }
    })
);

async function readData() {
    try {
        const raw = await fs.readFile(DATA_FILE, "utf8");
        return JSON.parse(raw);
    } catch (error) {
        if (error.code === "ENOENT") {
            throw new Error("data.json not found");
        }
        throw error;
    }
}

async function writeData(data) {
    await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2), "utf8");
}

app.get("/", (req, res) => {
    res.sendFile(path.join(PUBLIC_DIR, "index.html"));
});

app.get("/admin", (req, res) => {
    res.sendFile(path.join(PUBLIC_DIR, "admin.html"));
});

app.get("/admin.html", (req, res) => {
    res.sendFile(path.join(PUBLIC_DIR, "admin.html"));
});

app.use(express.static(PUBLIC_DIR));

app.post("/api/login", async (req, res) => {
    try {
        const { username, password } = req.body;
        const data = await readData();
        if (data.admin && username === data.admin.username && password === data.admin.password) {
            req.session.isAdmin = true;
            return res.json({ success: true, message: "Login successful." });
        }
        return res.status(401).json({ success: false, message: "Invalid username or password." });
    } catch (error) {
        res.status(500).json({ success: false, message: "Internal server error." });
    }
});

app.get("/api/auth", (req, res) => {
    res.json({ authenticated: req.session.isAdmin === true });
});

app.post("/api/logout", (req, res) => {
    req.session.destroy(() => {
        res.clearCookie("connect.sid");
        res.json({ success: true, message: "Logged out successfully." });
    });
});

function requireAdmin(req, res, next) {
    if (req.session.isAdmin === true) return next();
    return res.status(401).json({ success: false, message: "Unauthorized. Please login first." });
}

app.get("/api/data", async (req, res) => {
    try {
        const data = await readData();
        const safeData = { ...data };
        delete safeData.admin;
        res.json(safeData);
    } catch (error) {
        res.status(500).json({ success: false, message: "Could not load website data." });
    }
});

app.put("/api/site", requireAdmin, async (req, res) => {
    try {
        const data = await readData();
        data.site = { ...data.site, ...req.body };
        await writeData(data);
        res.json({ success: true, message: "Site info updated successfully.", site: data.site });
    } catch (error) {
        res.status(500).json({ success: false, message: "Could not update site info." });
    }
});

// =========================================================
// TRAINERS CRUD WITH FILE UPLOAD SUPPORT
// =========================================================

app.post("/api/trainers", requireAdmin, upload.single("imageFile"), async (req, res) => {
    try {
        const { name, role, image, bio } = req.body;
        if (!name || !role) {
            return res.status(400).json({ success: false, message: "Name and role are required." });
        }

        let imagePath = image ? String(image).trim() : "";
        if (req.file) {
            imagePath = `/uploads/${req.file.filename}`;
        }

        const data = await readData();
        if (!Array.isArray(data.trainers)) data.trainers = [];

        const trainer = {
            id: crypto.randomUUID(),
            name: String(name).trim(),
            role: String(role).trim(),
            image: imagePath,
            bio: bio ? String(bio).trim() : ""
        };

        data.trainers.push(trainer);
        await writeData(data);
        res.json({ success: true, message: "Trainer added successfully.", trainer });
    } catch (error) {
        console.error("ADD TRAINER ERROR:", error);
        res.status(500).json({ success: false, message: "Could not add trainer." });
    }
});

app.put("/api/trainers/:id", requireAdmin, upload.single("imageFile"), async (req, res) => {
    try {
        const data = await readData();
        const index = (data.trainers || []).findIndex(t => String(t.id) === String(req.params.id));

        if (index === -1) return res.status(404).json({ success: false, message: "Trainer not found." });

        let imagePath = req.body.image ?? data.trainers[index].image;
        if (req.file) {
            imagePath = `/uploads/${req.file.filename}`;
        }

        data.trainers[index] = {
            ...data.trainers[index],
            name: req.body.name ?? data.trainers[index].name,
            role: req.body.role ?? data.trainers[index].role,
            image: imagePath,
            bio: req.body.bio ?? data.trainers[index].bio
        };

        await writeData(data);
        res.json({ success: true, message: "Trainer updated successfully.", trainer: data.trainers[index] });
    } catch (error) {
        console.error("UPDATE TRAINER ERROR:", error);
        res.status(500).json({ success: false, message: "Could not update trainer." });
    }
});

app.delete("/api/trainers/:id", requireAdmin, async (req, res) => {
    try {
        const data = await readData();
        data.trainers = data.trainers.filter(t => String(t.id) !== String(req.params.id));
        await writeData(data);
        res.json({ success: true, message: "Trainer deleted successfully." });
    } catch (error) {
        res.status(500).json({ success: false, message: "Could not delete trainer." });
    }
});

// (Baaki programs, schedule, pricing, testimonials ki routes pehle jaisi hi rahengi)

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
