require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const app = express();
app.use(express.json());
app.use(cors());

// Connect to MongoDB
mongoose
  .connect(
    "mongodb+srv://lit2024054:narutouzumaki21@cluster0.vxukb.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0",
    {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    }
  )
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.log(err));

// User Schema
const UserSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
  role: String, // 'student' or 'teacher'
});

const User = mongoose.model("User", UserSchema);

// Register Route
app.post("/register", async (req, res) => {
  const { name, email, password, role } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  
  try {
    const user = new User({ name, email, password: hashedPassword, role });
    await user.save();
    res.status(201).json({ message: "User registered successfully" });
  } catch (err) {
    res.status(500).json({ error: "Error registering user" });
  }
});

// Login Route
app.post("/login", async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });

  if (!user) return res.status(400).json({ error: "User not found" });

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) return res.status(400).json({ error: "Invalid credentials" });

  const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: "1h",
  });

  res.json({ token, role: user.role });
});

// === Doubt Model and Routes ===

// Doubt Schema
const DoubtSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: false },
  question: { type: String, required: true },
  aiResponse: { type: String, required: true },
  conversation: { type: Array, default: [] },
  createdAt: { type: Date, default: Date.now }
});

const Doubt = mongoose.model("Doubt", DoubtSchema);

// POST route to store doubt forwarded to teacher
app.post("/api/doubts", async (req, res) => {
  const { studentId, question, aiResponse, conversation } = req.body;
  
  try {
    const doubt = new Doubt({ studentId, question, aiResponse, conversation });
    await doubt.save();
    res.status(201).json({ message: "Doubt forwarded to teacher successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error forwarding doubt" });
  }
});

// GET route to fetch all doubts (for teacher dashboard)
app.get("/api/doubts", async (req, res) => {
  try {
    const doubts = await Doubt.find().sort({ createdAt: -1 });
    res.json(doubts);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error fetching doubts" });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
