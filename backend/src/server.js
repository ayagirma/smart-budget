import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./routes/authRoutes.js";
import categoryRoutes from "./routes/categoryRoutes.js";
import transactionRoutes from "./routes/transactionRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import budgetRoutes from "./routes/budgetRoutes.js";
import billRoutes from "./routes/billRoutes.js";
import plaidRoutes from "./routes/plaidRoutes.js";
import ruleRoutes from "./routes/ruleRoutes.js";

dotenv.config();

if (!process.env.JWT_SECRET) {
  console.error("FATAL ERROR: JWT_SECRET environment variable is missing.");
  process.exit(1);
}

const app = express();

const corsOptions = {
  origin: process.env.NODE_ENV === "production"
    ? (process.env.FRONTEND_URL || "http://localhost:3000")
    : "*"
};
app.use(cors(corsOptions));
app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/users", userRoutes);
app.use("/api/budgets", budgetRoutes);
app.use("/api/bills", billRoutes);
app.use("/api/plaid", plaidRoutes);
app.use("/api/rules", ruleRoutes);

app.get("/", (req, res) => {
  res.send("Budget App ApI is running");
});

app.listen(5000, () => {
  console.log("server running on port 5000");
});
