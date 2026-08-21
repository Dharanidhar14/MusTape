import pg from "pg";
import { serverConfig } from "../config/server.js";
import { logger } from "../services/logger.js";

const { Pool } = pg;

const pool = new Pool({
  connectionString: serverConfig.dbUrl,
  ssl: serverConfig.nodeEnv === "production" ? { rejectUnauthorized: false } : false
});

pool.on("error", (err) => {
  logger.error("db.pool_error", { error: err.message });
});

export async function query(text, params) {
  const start = Date.now();
  const res = await pool.query(text, params);
  const duration = Date.now() - start;
  logger.debug("db.query", { text, duration, rows: res.rowCount });
  return res;
}

export async function getClient() {
  return await pool.connect();
}
