import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database("transactions.db");

// Initialize database
db.exec(`
  CREATE TABLE IF NOT EXISTS transactions (
    hash TEXT PRIMARY KEY,
    network TEXT,
    amount TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.post("/api/verify-transaction", (req, res) => {
    const { hash, network, amount } = req.body;

    if (!hash || !network) {
      return res.status(400).json({ error: "Missing hash or network" });
    }

    try {
      // Check for duplicate
      const existing = db.prepare("SELECT * FROM transactions WHERE hash = ?").get(hash);
      if (existing) {
        return res.status(400).json({ error: "Duplicate transaction detected" });
      }

      // In a real app, you would verify the transaction on-chain here
      // For this demo, we'll assume the client-side tx.wait() was successful
      // and just record it to prevent duplicates.
      
      db.prepare("INSERT INTO transactions (hash, network, amount) VALUES (?, ?, ?)").run(hash, network, amount || "0");

      res.json({ success: true, message: "Transaction verified and recorded" });
    } catch (error: any) {
      console.error("Verification error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
