import dotenv from "dotenv";
import { prisma } from "@smartapply/database";
import app from "./app";

// Initialize env
dotenv.config({ path: "../../../.env" });
dotenv.config();

const PORT = process.env.PORT || 5000;

// Connect to db and start server
async function start() {
  try {
    await prisma.$connect();
    console.log("Successfully connected to PostgreSQL database");

    app.listen(PORT, () => {
      console.log(`SmartApply API server running on port ${PORT}`);

      // Start consolidated BullMQ worker if RUN_WORKER env is set
      if (process.env.RUN_WORKER === "true") {
        console.log("Starting consolidated background worker...");
        const path = require("path");
        try {
          const prodWorkerPath = path.resolve(__dirname, "../../worker/dist/worker.js");
          require(prodWorkerPath);
          console.log("Consolidated worker loaded from compiled JS successfully.");
        } catch (err: any) {
          console.warn("Compiled worker not found, attempting to load development TS worker:", err.message);
          try {
            const devWorkerPath = path.resolve(__dirname, "../../worker/src/worker.ts");
            require(devWorkerPath);
            console.log("Consolidated worker loaded from source TS successfully.");
          } catch (devErr: any) {
            console.error("Failed to load consolidated worker:", devErr.message);
          }
        }
      }
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

start();
