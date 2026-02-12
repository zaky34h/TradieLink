const fs = require("fs");
const path = require("path");
const express = require("express");
const cors = require("cors");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
const { Pool } = require("pg");

dotenv.config();

const PORT = Number(process.env.PORT || 4000);
const DATABASE_URL = process.env.DATABASE_URL;
const JWT_SECRET = process.env.JWT_SECRET || "tradielink_dev_secret";
const BCRYPT_ROUNDS = 10;

if (!DATABASE_URL) {
  throw new Error("Missing DATABASE_URL in backend/.env");
}

const pool = new Pool({
  connectionString: DATABASE_URL,
});

const app = express();
app.use(cors());
app.use(express.json());

function normalizeRole(input) {
  const role = String(input || "").trim().toLowerCase();
  if (role === "builder") return "builder";
  if (role === "tradie" || role === "labourer") return "tradie";
  return null;
}

function asNumberOrNull(value) {
  if (value === undefined || value === null || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function splitCertifications(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value.map((v) => String(v).trim()).filter(Boolean);
  return String(value)
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);
}

function mapUserRow(row) {
  return {
    id: row.id,
    role: row.role,
    firstName: row.first_name,
    lastName: row.last_name,
    about: row.about,
    companyName: row.company_name,
    address: row.address,
    occupation: row.occupation,
    pricePerHour: row.price_per_hour === null ? null : Number(row.price_per_hour),
    experienceYears: row.experience_years,
    certifications: row.certifications || [],
    photoUrl: row.photo_url,
    email: row.email,
    createdAt: row.created_at,
  };
}

async function loadUserByEmail(email) {
  const result = await pool.query("SELECT * FROM users WHERE email = $1 LIMIT 1", [email]);
  if (!result.rowCount) return null;
  return mapUserRow(result.rows[0]);
}

function toInt(value) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) return null;
  return parsed;
}

function authRequired(req, res, next) {
  (async () => {
    try {
      const authorization = req.headers.authorization || "";
      if (!authorization.startsWith("Bearer ")) {
        return res.status(401).json({ ok: false, error: "Missing bearer token." });
      }

      const token = authorization.slice("Bearer ".length).trim();
      if (!token) return res.status(401).json({ ok: false, error: "Missing bearer token." });

      const payload = jwt.verify(token, JWT_SECRET);
      const email = String(payload?.email || "").trim().toLowerCase();
      if (!email) return res.status(401).json({ ok: false, error: "Invalid token." });

      const user = await loadUserByEmail(email);
      if (!user) return res.status(401).json({ ok: false, error: "User not found." });

      req.authUser = user;
      return next();
    } catch (error) {
      return res.status(401).json({ ok: false, error: "Invalid or expired token." });
    }
  })();
}

async function initDb() {
  const initSqlPath = path.join(__dirname, "sql.init.sql");
  const initSql = fs.readFileSync(initSqlPath, "utf8");
  await pool.query(initSql);
}

app.get("/health", async (_req, res) => {
  try {
    await pool.query("SELECT 1");
    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ ok: false, error: "Database connection failed." });
  }
});

app.post("/auth/register", async (req, res) => {
  try {
    const role = normalizeRole(req.body.role);
    if (!role) return res.status(400).json({ ok: false, error: "Invalid role." });

    const firstName = String(req.body.firstName || "").trim();
    const lastName = String(req.body.lastName || "").trim();
    const about = String(req.body.about || "").trim();
    const email = String(req.body.email || "").trim().toLowerCase();
    const password = String(req.body.password || "");

    if (!firstName || !lastName || !about) {
      return res.status(400).json({ ok: false, error: "Missing required profile fields." });
    }
    if (!email) return res.status(400).json({ ok: false, error: "Email is required." });
    if (!password || password.length < 6) {
      return res.status(400).json({ ok: false, error: "Password must be at least 6 characters." });
    }

    let companyName = null;
    let address = null;
    let occupation = null;
    let pricePerHour = null;
    let experienceYears = null;
    let certifications = [];
    let photoUrl = null;

    if (role === "builder") {
      companyName = String(req.body.companyName || "").trim();
      address = String(req.body.address || "").trim();
      if (!companyName || !address) {
        return res.status(400).json({ ok: false, error: "Builder requires company name and address." });
      }
    } else {
      occupation = String(req.body.occupation || "").trim();
      pricePerHour = asNumberOrNull(req.body.pricePerHour);
      experienceYears = asNumberOrNull(req.body.experienceYears);
      certifications = splitCertifications(req.body.certifications);
      photoUrl = String(req.body.photoUrl || "").trim() || null;

      if (!occupation) return res.status(400).json({ ok: false, error: "Tradie occupation is required." });
      if (pricePerHour === null || pricePerHour <= 0) {
        return res.status(400).json({ ok: false, error: "Tradie pricePerHour must be greater than 0." });
      }
      if (experienceYears === null || experienceYears < 0) {
        return res.status(400).json({ ok: false, error: "Tradie experienceYears must be 0 or more." });
      }
      if (!certifications.length) {
        return res.status(400).json({ ok: false, error: "At least one certification is required." });
      }
    }

    const existing = await pool.query("SELECT id FROM users WHERE email = $1", [email]);
    if (existing.rowCount > 0) {
      return res.status(409).json({ ok: false, error: "Email already registered." });
    }

    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
    const insertResult = await pool.query(
      `INSERT INTO users (
        role, first_name, last_name, about,
        company_name, address, occupation, price_per_hour,
        experience_years, certifications, photo_url,
        email, password_hash
      ) VALUES (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13
      )
      RETURNING *`,
      [
        role,
        firstName,
        lastName,
        about,
        companyName,
        address,
        occupation,
        pricePerHour,
        experienceYears,
        certifications,
        photoUrl,
        email,
        passwordHash,
      ]
    );

    const user = mapUserRow(insertResult.rows[0]);
    const token = jwt.sign({ email: user.email, role: user.role }, JWT_SECRET, {
      expiresIn: "7d",
    });

    return res.status(201).json({ ok: true, token, user });
  } catch (error) {
    console.error("register error:", error);
    return res.status(500).json({ ok: false, error: "Failed to register user." });
  }
});

app.post("/auth/login", async (req, res) => {
  try {
    const email = String(req.body.email || "").trim().toLowerCase();
    const password = String(req.body.password || "");
    if (!email || !password) {
      return res.status(400).json({ ok: false, error: "Email and password are required." });
    }

    const result = await pool.query("SELECT * FROM users WHERE email = $1 LIMIT 1", [email]);
    if (!result.rowCount) {
      return res.status(401).json({ ok: false, error: "Invalid email or password." });
    }

    const row = result.rows[0];
    const passwordOk = await bcrypt.compare(password, row.password_hash);
    if (!passwordOk) {
      return res.status(401).json({ ok: false, error: "Invalid email or password." });
    }

    const user = mapUserRow(row);
    const token = jwt.sign({ email: user.email, role: user.role }, JWT_SECRET, {
      expiresIn: "7d",
    });

    return res.json({ ok: true, token, user });
  } catch (error) {
    console.error("login error:", error);
    return res.status(500).json({ ok: false, error: "Login failed." });
  }
});

app.get("/builders", authRequired, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, first_name, last_name, company_name
       FROM users
       WHERE role = 'builder'
       ORDER BY COALESCE(company_name, ''), first_name, last_name`
    );

    const builders = result.rows.map((row) => ({
      id: row.id,
      firstName: row.first_name,
      lastName: row.last_name,
      companyName: row.company_name,
      displayName: row.company_name || `${row.first_name} ${row.last_name}`.trim(),
    }));

    return res.json({ ok: true, builders });
  } catch (error) {
    console.error("builders list error:", error);
    return res.status(500).json({ ok: false, error: "Failed to load builders." });
  }
});

app.get("/messages/threads", authRequired, async (req, res) => {
  try {
    const userId = req.authUser.id;
    const role = req.authUser.role;

    const query =
      role === "builder"
        ? `SELECT
            t.id,
            t.builder_id,
            t.tradie_id,
            t.created_at,
            b.first_name AS builder_first_name,
            b.last_name AS builder_last_name,
            b.company_name AS builder_company_name,
            tr.first_name AS tradie_first_name,
            tr.last_name AS tradie_last_name,
            tr.occupation AS tradie_occupation,
            lm.body AS last_message_body,
            lm.created_at AS last_message_at,
            lm.sender_id AS last_message_sender_id
          FROM chat_threads t
          JOIN users b ON b.id = t.builder_id
          JOIN users tr ON tr.id = t.tradie_id
          LEFT JOIN LATERAL (
            SELECT body, created_at, sender_id
            FROM chat_messages m
            WHERE m.thread_id = t.id
            ORDER BY m.created_at DESC
            LIMIT 1
          ) lm ON TRUE
          WHERE t.builder_id = $1
          ORDER BY COALESCE(lm.created_at, t.created_at) DESC`
        : `SELECT
            t.id,
            t.builder_id,
            t.tradie_id,
            t.created_at,
            b.first_name AS builder_first_name,
            b.last_name AS builder_last_name,
            b.company_name AS builder_company_name,
            tr.first_name AS tradie_first_name,
            tr.last_name AS tradie_last_name,
            tr.occupation AS tradie_occupation,
            lm.body AS last_message_body,
            lm.created_at AS last_message_at,
            lm.sender_id AS last_message_sender_id
          FROM chat_threads t
          JOIN users b ON b.id = t.builder_id
          JOIN users tr ON tr.id = t.tradie_id
          LEFT JOIN LATERAL (
            SELECT body, created_at, sender_id
            FROM chat_messages m
            WHERE m.thread_id = t.id
            ORDER BY m.created_at DESC
            LIMIT 1
          ) lm ON TRUE
          WHERE t.tradie_id = $1
          ORDER BY COALESCE(lm.created_at, t.created_at) DESC`;

    const result = await pool.query(query, [userId]);
    const threads = result.rows.map((row) => ({
      id: row.id,
      builderId: row.builder_id,
      tradieId: row.tradie_id,
      createdAt: row.created_at,
      participant:
        role === "builder"
          ? {
              id: row.tradie_id,
              role: "tradie",
              name: `${row.tradie_first_name} ${row.tradie_last_name}`.trim(),
              subtitle: row.tradie_occupation || "Tradie",
            }
          : {
              id: row.builder_id,
              role: "builder",
              name:
                row.builder_company_name ||
                `${row.builder_first_name} ${row.builder_last_name}`.trim(),
              subtitle: row.builder_company_name
                ? `${row.builder_first_name} ${row.builder_last_name}`.trim()
                : "Builder",
            },
      lastMessage: row.last_message_body || null,
      lastMessageAt: row.last_message_at || row.created_at,
      lastMessageSenderId: row.last_message_sender_id || null,
    }));

    return res.json({ ok: true, threads });
  } catch (error) {
    console.error("threads list error:", error);
    return res.status(500).json({ ok: false, error: "Failed to load message threads." });
  }
});

app.get("/messages/threads/:threadId", authRequired, async (req, res) => {
  try {
    const threadId = toInt(req.params.threadId);
    if (!threadId) return res.status(400).json({ ok: false, error: "Invalid thread id." });

    const threadResult = await pool.query(
      `SELECT t.*, b.first_name AS builder_first_name, b.last_name AS builder_last_name,
              b.company_name AS builder_company_name,
              tr.first_name AS tradie_first_name, tr.last_name AS tradie_last_name, tr.occupation AS tradie_occupation
       FROM chat_threads t
       JOIN users b ON b.id = t.builder_id
       JOIN users tr ON tr.id = t.tradie_id
       WHERE t.id = $1
       LIMIT 1`,
      [threadId]
    );

    if (!threadResult.rowCount) {
      return res.status(404).json({ ok: false, error: "Thread not found." });
    }

    const thread = threadResult.rows[0];
    const userId = req.authUser.id;
    if (thread.builder_id !== userId && thread.tradie_id !== userId) {
      return res.status(403).json({ ok: false, error: "You do not have access to this thread." });
    }

    const messagesResult = await pool.query(
      `SELECT m.id, m.thread_id, m.sender_id, m.body, m.created_at,
              u.first_name, u.last_name, u.role
       FROM chat_messages m
       JOIN users u ON u.id = m.sender_id
       WHERE m.thread_id = $1
       ORDER BY m.created_at ASC`,
      [threadId]
    );

    const messages = messagesResult.rows.map((row) => ({
      id: row.id,
      threadId: row.thread_id,
      senderId: row.sender_id,
      senderRole: row.role,
      senderName: `${row.first_name} ${row.last_name}`.trim(),
      body: row.body,
      createdAt: row.created_at,
    }));

    const payload = {
      id: thread.id,
      builderId: thread.builder_id,
      tradieId: thread.tradie_id,
      createdAt: thread.created_at,
      builder: {
        id: thread.builder_id,
        name:
          thread.builder_company_name ||
          `${thread.builder_first_name} ${thread.builder_last_name}`.trim(),
      },
      tradie: {
        id: thread.tradie_id,
        name: `${thread.tradie_first_name} ${thread.tradie_last_name}`.trim(),
        occupation: thread.tradie_occupation || null,
      },
    };

    return res.json({ ok: true, thread: payload, messages });
  } catch (error) {
    console.error("thread detail error:", error);
    return res.status(500).json({ ok: false, error: "Failed to load thread." });
  }
});

app.post("/messages/threads", authRequired, async (req, res) => {
  try {
    if (req.authUser.role !== "tradie") {
      return res.status(403).json({ ok: false, error: "Only tradies can start new chats." });
    }

    const builderId = toInt(req.body.builderId);
    if (!builderId) {
      return res.status(400).json({ ok: false, error: "builderId is required." });
    }

    const builderResult = await pool.query(
      "SELECT id FROM users WHERE id = $1 AND role = 'builder' LIMIT 1",
      [builderId]
    );
    if (!builderResult.rowCount) {
      return res.status(404).json({ ok: false, error: "Builder not found." });
    }

    const threadResult = await pool.query(
      `INSERT INTO chat_threads (builder_id, tradie_id)
       VALUES ($1, $2)
       ON CONFLICT (builder_id, tradie_id)
       DO UPDATE SET builder_id = EXCLUDED.builder_id
       RETURNING *`,
      [builderId, req.authUser.id]
    );

    const thread = threadResult.rows[0];
    const initialBody = String(req.body.message || "").trim();
    let message = null;

    if (initialBody) {
      const messageResult = await pool.query(
        `INSERT INTO chat_messages (thread_id, sender_id, body)
         VALUES ($1, $2, $3)
         RETURNING id, thread_id, sender_id, body, created_at`,
        [thread.id, req.authUser.id, initialBody]
      );
      message = messageResult.rows[0];
    }

    return res.status(201).json({
      ok: true,
      thread: {
        id: thread.id,
        builderId: thread.builder_id,
        tradieId: thread.tradie_id,
        createdAt: thread.created_at,
      },
      message,
    });
  } catch (error) {
    console.error("create thread error:", error);
    return res.status(500).json({ ok: false, error: "Failed to create message thread." });
  }
});

app.post("/messages/threads/:threadId/messages", authRequired, async (req, res) => {
  try {
    const threadId = toInt(req.params.threadId);
    if (!threadId) return res.status(400).json({ ok: false, error: "Invalid thread id." });

    const body = String(req.body.body || "").trim();
    if (!body) return res.status(400).json({ ok: false, error: "Message body is required." });

    const threadResult = await pool.query(
      "SELECT id, builder_id, tradie_id FROM chat_threads WHERE id = $1 LIMIT 1",
      [threadId]
    );
    if (!threadResult.rowCount) {
      return res.status(404).json({ ok: false, error: "Thread not found." });
    }

    const thread = threadResult.rows[0];
    const userId = req.authUser.id;
    if (thread.builder_id !== userId && thread.tradie_id !== userId) {
      return res.status(403).json({ ok: false, error: "You do not have access to this thread." });
    }

    const messageResult = await pool.query(
      `INSERT INTO chat_messages (thread_id, sender_id, body)
       VALUES ($1, $2, $3)
       RETURNING id, thread_id, sender_id, body, created_at`,
      [threadId, userId, body]
    );

    const message = messageResult.rows[0];
    return res.status(201).json({
      ok: true,
      message: {
        id: message.id,
        threadId: message.thread_id,
        senderId: message.sender_id,
        body: message.body,
        createdAt: message.created_at,
      },
    });
  } catch (error) {
    console.error("send message error:", error);
    return res.status(500).json({ ok: false, error: "Failed to send message." });
  }
});

initDb()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`TradieLink API running on http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    console.error("Failed to initialize database:", error);
    process.exit(1);
  });
