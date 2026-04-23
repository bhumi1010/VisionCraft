const express = require("express");
const session = require("express-session");
const bcrypt = require("bcrypt");
const path = require("path");
const fs = require("fs");

const app = express();

// FILE PATHS
const USERS_FILE = path.join(__dirname, "users.json");
const GOALS_FILE = path.join(__dirname, "goals.json");
const VISION_FILE = path.join(__dirname, "vision.json");

// MIDDLEWARE
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(session({
  name: "visioncraft.sid",
  secret: "visioncraft_secret_key",
  resave: false,
  saveUninitialized: false
}));

app.use(express.static(path.join(__dirname, "../public")));

// ===== USERS =====
function getUsers() {
  try { return JSON.parse(fs.readFileSync(USERS_FILE, "utf8") || "[]"); }
  catch { return []; }
}
function saveUsers(u) {
  fs.writeFileSync(USERS_FILE, JSON.stringify(u, null, 2));
}

// ===== GOALS =====
function getGoals() {
  try { return JSON.parse(fs.readFileSync(GOALS_FILE, "utf8") || "[]"); }
  catch { return []; }
}
function saveGoals(g) {
  fs.writeFileSync(GOALS_FILE, JSON.stringify(g, null, 2));
}

// ===== VISION =====
function getVision() {
  try { return JSON.parse(fs.readFileSync(VISION_FILE, "utf8") || "[]"); }
  catch { return []; }
}
function saveVision(v) {
  fs.writeFileSync(VISION_FILE, JSON.stringify(v, null, 2));
}

// ===== SIGNUP =====
app.post("/signup", async (req, res) => {
  const { name, email, password } = req.body;

  const users = getUsers();
  if (users.find(u => u.email === email))
    return res.json({ success: false, message: "User exists" });

  const hashed = await bcrypt.hash(password, 10);
  users.push({ name, email, password: hashed });
  saveUsers(users);

  res.json({ success: true });
});

// ===== LOGIN =====
app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  const users = getUsers();
  const user = users.find(u => u.email === email);

  if (!user || !(await bcrypt.compare(password, user.password)))
    return res.json({ success: false, message: "Invalid credentials" });

  req.session.user = { name: user.name, email: user.email };
  res.json({ success: true });
});

// ===== AUTH =====
app.get("/auth-check", (req, res) => {
  res.json({ loggedIn: !!req.session.user, user: req.session.user });
});

// ===== LOGOUT =====
app.post("/logout", (req, res) => {
  req.session.destroy(() => res.json({ success: true }));
});

// ===== GOALS =====
app.post("/add-goal", (req, res) => {
  if (!req.session.user) return res.json({ success: false });

  const goals = getGoals();
  goals.push({
    id: Date.now(),
    userEmail: req.session.user.email,
    category: req.body.category,
    goal: req.body.goal,
    period: req.body.period,
    tasks: []
  });

  saveGoals(goals);
  res.json({ success: true });
});

app.get("/get-goals", (req, res) => {
  if (!req.session.user) return res.json([]);

  const goals = getGoals().filter(
    g => g.userEmail === req.session.user.email
  );

  res.json(goals);
});

app.post("/add-task", (req, res) => {
  const { id, text } = req.body;
  const goals = getGoals();

  const goal = goals.find(g => g.id === id);
  if (goal) goal.tasks.push({ text, done: false });

  saveGoals(goals);
  res.json({ success: true });
});

app.post("/toggle-task", (req, res) => {
  const { id, index } = req.body;
  const goals = getGoals();

  const goal = goals.find(g => g.id === id);
  if (goal) goal.tasks[index].done = !goal.tasks[index].done;

  saveGoals(goals);
  res.json({ success: true });
});

app.post("/delete-goal", (req, res) => {
  let goals = getGoals();
  goals = goals.filter(g => g.id !== req.body.id);
  saveGoals(goals);
  res.json({ success: true });
});

// ===== VISION =====
app.post("/add-vision", (req, res) => {
  if (!req.session.user) return res.json({ success: false });

  const vision = getVision();

  vision.push({
    id: Date.now(),
    userEmail: req.session.user.email,
    type: req.body.type,
    content: req.body.content
  });

  saveVision(vision);
  res.json({ success: true });
});

app.get("/get-vision", (req, res) => {
  if (!req.session.user) return res.json([]);

  const data = getVision().filter(
    v => v.userEmail === req.session.user.email
  );

  res.json(data);
});

app.post("/delete-vision", (req, res) => {
  let vision = getVision();
  vision = vision.filter(v => v.id !== req.body.id);
  saveVision(vision);
  res.json({ success: true });
});

// ===== HOME =====
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/index.html"));
});

app.listen(5000, () => {
  console.log("VisionCraft running at http://localhost:5000");
});