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

function splitTradesNeeded(value) {
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

function mapBuilderJobRow(row, tradieById = new Map()) {
  const enquiryTradieIds = Array.isArray(row.enquiry_tradie_ids)
    ? row.enquiry_tradie_ids.map((id) => toInt(id)).filter(Boolean)
    : [];
  return {
    id: row.id,
    builderId: row.builder_id,
    title: row.title,
    location: row.location || "",
    tradesNeeded: row.trades_needed || [],
    details: row.details || "",
    status: row.status,
    interestedTradies: row.interested_tradies || [],
    enquiries: enquiryTradieIds
      .map((tradieId) => tradieById.get(tradieId))
      .filter(Boolean)
      .map((tradie) => ({
        id: tradie.id,
        name: `${tradie.first_name} ${tradie.last_name}`.trim(),
        occupation: tradie.occupation || null,
      })),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
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

app.get("/me/stats", authRequired, async (req, res) => {
  try {
    if (req.authUser.role !== "builder") {
      return res.status(403).json({ ok: false, error: "Only builders can access dashboard stats." });
    }

    const builderId = req.authUser.id;
    const [chatResult, jobsResult] = await Promise.all([
      pool.query(
        `SELECT
           COUNT(*)::int AS thread_count,
           COUNT(DISTINCT tradie_id)::int AS saved_tradies
         FROM chat_threads
         WHERE builder_id = $1`,
        [builderId]
      ),
      pool.query(
        `SELECT
           COUNT(*) FILTER (WHERE status = 'posted')::int AS posted_count,
           COUNT(*) FILTER (WHERE status = 'inProgress')::int AS in_progress_count
         FROM builder_jobs
         WHERE builder_id = $1`,
        [builderId]
      ),
    ]);

    const chatRow = chatResult.rows[0] || {};
    const jobsRow = jobsResult.rows[0] || {};
    return res.json({
      ok: true,
      stats: {
        activeChats: Number(chatRow.thread_count || 0),
        pendingOffers: Number(jobsRow.posted_count || 0),
        savedTradies: Number(chatRow.saved_tradies || 0),
        pendingPay: Number(jobsRow.in_progress_count || 0),
      },
    });
  } catch (error) {
    console.error("builder stats error:", error);
    return res.status(500).json({ ok: false, error: "Failed to load dashboard stats." });
  }
});

app.get("/builder/jobs", authRequired, async (req, res) => {
  try {
    if (req.authUser.role !== "builder") {
      return res.status(403).json({ ok: false, error: "Only builders can access jobs." });
    }

    const result = await pool.query(
      `SELECT *
       FROM builder_jobs
       WHERE builder_id = $1
       ORDER BY created_at DESC`,
      [req.authUser.id]
    );

    const tradieIds = Array.from(
      new Set(
        result.rows
          .flatMap((row) => (Array.isArray(row.enquiry_tradie_ids) ? row.enquiry_tradie_ids : []))
          .map((id) => toInt(id))
          .filter(Boolean)
      )
    );

    let tradieById = new Map();
    if (tradieIds.length) {
      const tradieResult = await pool.query(
        `SELECT id, first_name, last_name, occupation
         FROM users
         WHERE role = 'tradie' AND id = ANY($1::int[])`,
        [tradieIds]
      );
      tradieById = new Map(tradieResult.rows.map((row) => [row.id, row]));
    }

    return res.json({ ok: true, jobs: result.rows.map((row) => mapBuilderJobRow(row, tradieById)) });
  } catch (error) {
    console.error("builder jobs list error:", error);
    return res.status(500).json({ ok: false, error: "Failed to load jobs." });
  }
});

app.post("/builder/jobs", authRequired, async (req, res) => {
  try {
    if (req.authUser.role !== "builder") {
      return res.status(403).json({ ok: false, error: "Only builders can create jobs." });
    }

    const title = String(req.body.title || "").trim();
    const location = String(req.body.location || "").trim() || null;
    const tradesNeeded = splitTradesNeeded(req.body.tradesNeeded);
    const details = String(req.body.details || "").trim() || null;
    const statusInput = String(req.body.status || "posted").trim();
    const status = ["posted", "inProgress", "done"].includes(statusInput) ? statusInput : null;

    if (!title) return res.status(400).json({ ok: false, error: "Job title is required." });
    if (!status) return res.status(400).json({ ok: false, error: "Invalid job status." });

    const result = await pool.query(
      `INSERT INTO builder_jobs (builder_id, title, location, trades_needed, details, status)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [req.authUser.id, title, location, tradesNeeded, details, status]
    );

    return res.status(201).json({ ok: true, job: mapBuilderJobRow(result.rows[0]) });
  } catch (error) {
    console.error("builder create job error:", error);
    return res.status(500).json({ ok: false, error: "Failed to create job." });
  }
});

app.get("/jobs", authRequired, async (req, res) => {
  try {
    if (req.authUser.role !== "tradie") {
      return res.status(403).json({ ok: false, error: "Only tradies can browse posted jobs." });
    }

    const result = await pool.query(
      `SELECT
         j.*,
         b.first_name AS builder_first_name,
         b.last_name AS builder_last_name,
         b.company_name AS builder_company_name
       FROM builder_jobs j
       JOIN users b ON b.id = j.builder_id
       WHERE j.status = 'posted'
       ORDER BY j.created_at DESC`
    );

    const jobs = result.rows.map((row) => {
      const enquiryTradieIds = Array.isArray(row.enquiry_tradie_ids)
        ? row.enquiry_tradie_ids.map((id) => toInt(id)).filter(Boolean)
        : [];
      const hasEnquired = enquiryTradieIds.includes(req.authUser.id);

      return {
        id: row.id,
        builderId: row.builder_id,
        builderDisplayName:
          row.builder_company_name || `${row.builder_first_name} ${row.builder_last_name}`.trim(),
        title: row.title,
        location: row.location || "",
        tradesNeeded: row.trades_needed || [],
        details: row.details || "",
        status: row.status,
        hasEnquired,
        enquiriesCount: enquiryTradieIds.length,
        createdAt: row.created_at,
      };
    });

    return res.json({ ok: true, jobs });
  } catch (error) {
    console.error("tradie jobs list error:", error);
    return res.status(500).json({ ok: false, error: "Failed to load posted jobs." });
  }
});

app.post("/jobs/:jobId/enquire", authRequired, async (req, res) => {
  try {
    if (req.authUser.role !== "tradie") {
      return res.status(403).json({ ok: false, error: "Only tradies can enquire on jobs." });
    }

    const jobId = toInt(req.params.jobId);
    if (!jobId) return res.status(400).json({ ok: false, error: "Invalid job id." });

    const tradieName = `${req.authUser.firstName || ""} ${req.authUser.lastName || ""}`.trim() || "Tradie";

    const result = await pool.query(
      `UPDATE builder_jobs
       SET enquiry_tradie_ids = CASE
             WHEN $2 = ANY(enquiry_tradie_ids) THEN enquiry_tradie_ids
             ELSE array_append(enquiry_tradie_ids, $2)
           END,
           interested_tradies = CASE
             WHEN $3 = ANY(interested_tradies) THEN interested_tradies
             ELSE array_append(interested_tradies, $3)
           END,
           updated_at = NOW()
       WHERE id = $1 AND status = 'posted'
       RETURNING id, enquiry_tradie_ids, interested_tradies`,
      [jobId, req.authUser.id, tradieName]
    );

    if (!result.rowCount) {
      return res.status(404).json({ ok: false, error: "Posted job not found." });
    }

    return res.status(201).json({
      ok: true,
      job: {
        id: result.rows[0].id,
        enquiryTradieIds: result.rows[0].enquiry_tradie_ids || [],
        interestedTradies: result.rows[0].interested_tradies || [],
      },
    });
  } catch (error) {
    console.error("tradie enquire job error:", error);
    return res.status(500).json({ ok: false, error: "Failed to submit enquiry." });
  }
});

app.put("/me", authRequired, async (req, res) => {
  try {
    const currentResult = await pool.query("SELECT * FROM users WHERE id = $1 LIMIT 1", [req.authUser.id]);
    if (!currentResult.rowCount) {
      return res.status(404).json({ ok: false, error: "User not found." });
    }

    const current = currentResult.rows[0];
    const role = current.role;

    const firstName =
      req.body.firstName === undefined ? current.first_name : String(req.body.firstName || "").trim();
    const lastName =
      req.body.lastName === undefined ? current.last_name : String(req.body.lastName || "").trim();
    const about = req.body.about === undefined ? current.about : String(req.body.about || "").trim();
    const email =
      req.body.email === undefined
        ? current.email
        : String(req.body.email || "").trim().toLowerCase();

    const companyName =
      req.body.companyName === undefined
        ? current.company_name
        : String(req.body.companyName || "").trim() || null;
    const address =
      req.body.address === undefined ? current.address : String(req.body.address || "").trim() || null;

    const occupation =
      req.body.occupation === undefined
        ? current.occupation
        : String(req.body.occupation || "").trim() || null;
    const pricePerHour =
      req.body.pricePerHour === undefined ? current.price_per_hour : asNumberOrNull(req.body.pricePerHour);
    const experienceYears =
      req.body.experienceYears === undefined
        ? current.experience_years
        : asNumberOrNull(req.body.experienceYears);
    const certifications =
      req.body.certifications === undefined ? current.certifications || [] : splitCertifications(req.body.certifications);
    const photoUrl =
      req.body.photoUrl === undefined ? current.photo_url : String(req.body.photoUrl || "").trim() || null;

    if (!firstName || !lastName || !about || !email) {
      return res.status(400).json({ ok: false, error: "firstName, lastName, about and email are required." });
    }

    if (role === "builder" && (!companyName || !address)) {
      return res.status(400).json({ ok: false, error: "Builder requires company name and address." });
    }

    if (role === "tradie") {
      if (!occupation) return res.status(400).json({ ok: false, error: "Tradie occupation is required." });
      if (pricePerHour === null || Number(pricePerHour) <= 0) {
        return res.status(400).json({ ok: false, error: "Tradie pricePerHour must be greater than 0." });
      }
      if (experienceYears === null || Number(experienceYears) < 0) {
        return res.status(400).json({ ok: false, error: "Tradie experienceYears must be 0 or more." });
      }
      if (!Array.isArray(certifications) || !certifications.length) {
        return res.status(400).json({ ok: false, error: "At least one certification is required." });
      }
    }

    if (email !== current.email) {
      const emailConflictResult = await pool.query("SELECT id FROM users WHERE email = $1 AND id <> $2 LIMIT 1", [
        email,
        current.id,
      ]);
      if (emailConflictResult.rowCount) {
        return res.status(409).json({ ok: false, error: "Email already registered." });
      }
    }

    let passwordHash = current.password_hash;
    if (req.body.password !== undefined) {
      const password = String(req.body.password || "");
      if (!password || password.length < 6) {
        return res.status(400).json({ ok: false, error: "Password must be at least 6 characters." });
      }
      passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
    }

    const updateResult = await pool.query(
      `UPDATE users
       SET first_name = $1,
           last_name = $2,
           about = $3,
           company_name = $4,
           address = $5,
           occupation = $6,
           price_per_hour = $7,
           experience_years = $8,
           certifications = $9,
           photo_url = $10,
           email = $11,
           password_hash = $12
       WHERE id = $13
       RETURNING *`,
      [
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
        current.id,
      ]
    );

    const user = mapUserRow(updateResult.rows[0]);
    const token = jwt.sign({ email: user.email, role: user.role }, JWT_SECRET, { expiresIn: "7d" });
    return res.json({ ok: true, token, user });
  } catch (error) {
    console.error("update profile error:", error);
    return res.status(500).json({ ok: false, error: "Failed to update profile." });
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

app.get("/tradies", authRequired, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, first_name, last_name, occupation
       FROM users
       WHERE role = 'tradie'
       ORDER BY first_name, last_name`
    );

    const tradies = result.rows.map((row) => ({
      id: row.id,
      firstName: row.first_name,
      lastName: row.last_name,
      occupation: row.occupation,
      displayName: `${row.first_name} ${row.last_name}`.trim(),
    }));

    return res.json({ ok: true, tradies });
  } catch (error) {
    console.error("tradies list error:", error);
    return res.status(500).json({ ok: false, error: "Failed to load tradies." });
  }
});

function getPeerIdFromThreadRow(thread, userId) {
  return thread.builder_id === userId ? thread.tradie_id : thread.builder_id;
}

app.get("/messages/threads", authRequired, async (req, res) => {
  try {
    const userId = req.authUser.id;
    const role = req.authUser.role;
    const view = String(req.query.view || "active").toLowerCase();
    const historyMode = view === "history";

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
          WHERE t.builder_id = $1`
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
          WHERE t.tradie_id = $1`;

    const [threadsResult, closuresResult, unreadResult] = await Promise.all([
      pool.query(query, [userId]),
      pool.query(
        `SELECT peer_id, closed_at
         FROM chat_thread_closures
         WHERE user_id = $1`,
        [userId]
      ),
      pool.query(
        `SELECT m.thread_id, COUNT(*)::int AS unread_count
         FROM chat_messages m
         JOIN chat_threads t ON t.id = m.thread_id
         LEFT JOIN chat_thread_reads r
           ON r.user_id = $1
          AND r.peer_id = CASE WHEN t.builder_id = $1 THEN t.tradie_id ELSE t.builder_id END
         WHERE (t.builder_id = $1 OR t.tradie_id = $1)
           AND m.sender_id <> $1
           AND m.created_at > COALESCE(r.last_read_at, TO_TIMESTAMP(0))
         GROUP BY m.thread_id`,
        [userId]
      ),
    ]);

    const closedAtByPeer = new Map(
      closuresResult.rows.map((row) => [row.peer_id, row.closed_at ? new Date(row.closed_at).getTime() : 0])
    );
    const unreadByThread = new Map(unreadResult.rows.map((row) => [row.thread_id, Number(row.unread_count || 0)]));

    const threads = [];
    for (const row of threadsResult.rows) {
      const peerId = getPeerIdFromThreadRow(row, userId);
      const lastMessageAtMs = row.last_message_at
        ? new Date(row.last_message_at).getTime()
        : new Date(row.created_at).getTime();
      const closedAtMs = Number(closedAtByPeer.get(peerId) || 0);

      if (historyMode) {
        if (!closedAtMs || lastMessageAtMs > closedAtMs) continue;
      } else if (closedAtMs && lastMessageAtMs <= closedAtMs) {
        continue;
      }

      threads.push({
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
        lastMessage: row.last_message_body || (historyMode ? "Chat closed" : null),
        lastMessageAt: row.last_message_at || row.created_at,
        lastMessageSenderId: row.last_message_sender_id || null,
        unreadCount: historyMode ? 0 : Number(unreadByThread.get(row.id) || 0),
      });
    }

    threads.sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime());
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
    let builderId = null;
    let tradieId = null;

    if (req.authUser.role === "tradie") {
      builderId = toInt(req.body.builderId);
      tradieId = req.authUser.id;
      if (!builderId) {
        return res.status(400).json({ ok: false, error: "builderId is required." });
      }
    } else if (req.authUser.role === "builder") {
      tradieId = toInt(req.body.tradieId);
      builderId = req.authUser.id;
      if (!tradieId) {
        return res.status(400).json({ ok: false, error: "tradieId is required." });
      }
    } else {
      return res.status(403).json({ ok: false, error: "Invalid user role." });
    }

    const [builderResult, tradieResult] = await Promise.all([
      pool.query("SELECT id FROM users WHERE id = $1 AND role = 'builder' LIMIT 1", [builderId]),
      pool.query("SELECT id FROM users WHERE id = $1 AND role = 'tradie' LIMIT 1", [tradieId]),
    ]);
    if (!builderResult.rowCount) {
      return res.status(404).json({ ok: false, error: "Builder not found." });
    }
    if (!tradieResult.rowCount) {
      return res.status(404).json({ ok: false, error: "Tradie not found." });
    }

    const threadResult = await pool.query(
      `INSERT INTO chat_threads (builder_id, tradie_id)
       VALUES ($1, $2)
       ON CONFLICT (builder_id, tradie_id)
       DO UPDATE SET builder_id = EXCLUDED.builder_id
       RETURNING *`,
      [builderId, tradieId]
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

    const peerId = thread.builder_id === userId ? thread.tradie_id : thread.builder_id;
    await pool.query(
      `INSERT INTO chat_typing (from_user_id, to_user_id, is_typing, updated_at)
       VALUES ($1, $2, FALSE, NOW())
       ON CONFLICT (from_user_id, to_user_id)
       DO UPDATE SET is_typing = EXCLUDED.is_typing, updated_at = EXCLUDED.updated_at`,
      [userId, peerId]
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

app.post("/messages/read", authRequired, async (req, res) => {
  try {
    const threadId = toInt(req.body.threadId);
    if (!threadId) return res.status(400).json({ ok: false, error: "threadId is required." });

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

    const peerId = thread.builder_id === userId ? thread.tradie_id : thread.builder_id;
    await pool.query(
      `INSERT INTO chat_thread_reads (user_id, peer_id, last_read_at)
       VALUES ($1, $2, NOW())
       ON CONFLICT (user_id, peer_id)
       DO UPDATE SET last_read_at = EXCLUDED.last_read_at`,
      [userId, peerId]
    );

    return res.json({ ok: true });
  } catch (error) {
    console.error("mark read error:", error);
    return res.status(500).json({ ok: false, error: "Failed to mark thread as read." });
  }
});

app.post("/messages/threads/:threadId/close", authRequired, async (req, res) => {
  try {
    const threadId = toInt(req.params.threadId);
    if (!threadId) return res.status(400).json({ ok: false, error: "Invalid thread id." });

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

    await pool.query(
      `INSERT INTO chat_thread_closures (user_id, peer_id, closed_at)
       VALUES ($1, $2, NOW()), ($2, $1, NOW())
       ON CONFLICT (user_id, peer_id)
       DO UPDATE SET closed_at = EXCLUDED.closed_at`,
      [thread.builder_id, thread.tradie_id]
    );

    return res.json({ ok: true });
  } catch (error) {
    console.error("close thread error:", error);
    return res.status(500).json({ ok: false, error: "Failed to close thread." });
  }
});

app.post("/messages/typing", authRequired, async (req, res) => {
  try {
    const threadId = toInt(req.body.threadId);
    const isTyping = Boolean(req.body.isTyping);
    if (!threadId) return res.status(400).json({ ok: false, error: "threadId is required." });

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

    const peerId = thread.builder_id === userId ? thread.tradie_id : thread.builder_id;
    await pool.query(
      `INSERT INTO chat_typing (from_user_id, to_user_id, is_typing, updated_at)
       VALUES ($1, $2, $3, NOW())
       ON CONFLICT (from_user_id, to_user_id)
       DO UPDATE SET is_typing = EXCLUDED.is_typing, updated_at = EXCLUDED.updated_at`,
      [userId, peerId, isTyping]
    );

    return res.json({ ok: true });
  } catch (error) {
    console.error("typing update error:", error);
    return res.status(500).json({ ok: false, error: "Failed to update typing state." });
  }
});

app.get("/messages/typing/:threadId", authRequired, async (req, res) => {
  try {
    const threadId = toInt(req.params.threadId);
    if (!threadId) return res.status(400).json({ ok: false, error: "Invalid thread id." });

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

    const peerId = thread.builder_id === userId ? thread.tradie_id : thread.builder_id;
    const freshAfter = Date.now() - 10_000;
    const typingResult = await pool.query(
      `SELECT from_user_id, to_user_id, is_typing
       FROM chat_typing
       WHERE (
         (from_user_id = $1 AND to_user_id = $2)
         OR (from_user_id = $2 AND to_user_id = $1)
       )
       AND updated_at >= TO_TIMESTAMP($3 / 1000.0)`,
      [userId, peerId, freshAfter]
    );

    let meTyping = false;
    let peerTyping = false;
    for (const row of typingResult.rows) {
      const active = Boolean(row.is_typing);
      if (row.from_user_id === userId && row.to_user_id === peerId) meTyping = active;
      if (row.from_user_id === peerId && row.to_user_id === userId) peerTyping = active;
    }

    return res.json({ ok: true, meTyping, peerTyping, eitherTyping: meTyping || peerTyping });
  } catch (error) {
    console.error("typing status error:", error);
    return res.status(500).json({ ok: false, error: "Failed to load typing status." });
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
