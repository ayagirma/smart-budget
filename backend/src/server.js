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

import debtRoutes from "./routes/debtRoutes.js";
import subscriptionRoutes from "./routes/subscriptionRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import { initExtraTables } from "./db/init_extra_tables.js";
import { initStripeSchema } from "./db/init_stripe_schema.js";

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

// Initialize DB schemas
initExtraTables();
initStripeSchema();

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/users", userRoutes);
app.use("/api/budgets", budgetRoutes);
app.use("/api/bills", billRoutes);
app.use("/api/plaid", plaidRoutes);
app.use("/api/rules", ruleRoutes);
app.use("/api/debts", debtRoutes);
app.use("/api/subscriptions", subscriptionRoutes);
app.use("/api/payments", paymentRoutes);

app.get("/", (req, res) => {
  res.send("Budget App API is running");
});

app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok", timestamp: new Date() });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
