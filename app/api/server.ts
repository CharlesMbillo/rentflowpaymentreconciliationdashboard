import express from "express";
import bodyParser from "body-parser";
import fs from "fs";
import path from "path";

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(bodyParser.json());

// Ensure logs folder exists
const logDir = path.join(__dirname, "logs");
if (!fs.existsSync(logDir)) fs.mkdirSync(logDir);

// ✅ Add the missing IPN route
app.post("/api/jenga/ipn", (req, res) => {
  console.log("✅ IPN Received:", req.body);
  
  const logPath = path.join(logDir, "ipn.log");
  fs.appendFileSync(logPath, `[${new Date().toISOString()}]\n${JSON.stringify(req.body, null, 2)}\n\n`);
  
  res.status(200).json({ message: "IPN received successfully" });
});

app.get("/", (_, res) => {
  res.send("✅ Rentflow IPN Server Running");
});

app.listen(PORT, () => {
  console.log(`🚀 Server listening on http://localhost:${PORT}`);
});
