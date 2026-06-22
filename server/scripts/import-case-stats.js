import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

const { Pool } = pg;
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATABASE_URL = process.env.DATABASE_URL;
const CASE_STATS_PATH = process.env.CASE_STATS_PATH || path.resolve(__dirname, "../../private-case-stats.json");

if (!DATABASE_URL) {
  console.error("DATABASE_URL is required");
  process.exit(1);
}

const payload = JSON.parse(fs.readFileSync(CASE_STATS_PATH, "utf8"));
const records = Array.isArray(payload.records) ? payload.records : [];
const pool = new Pool({ connectionString: DATABASE_URL, ssl: { rejectUnauthorized: false } });

await pool.query(`
  create table if not exists case_stats (
    id bigserial primary key,
    school_type text not null,
    major_group text not null,
    target_university text not null,
    score_band text not null,
    offers integer not null,
    rejects integer not null,
    total integer not null,
    offer_rate numeric(6,3) not null,
    unique (school_type, major_group, target_university, score_band)
  );
`);
await pool.query("truncate table case_stats");

const client = await pool.connect();
try {
  await client.query("begin");
  for (const record of records) {
    await client.query(
      `insert into case_stats
        (school_type, major_group, target_university, score_band, offers, rejects, total, offer_rate)
       values ($1,$2,$3,$4,$5,$6,$7,$8)`,
      [
        record.schoolType,
        record.majorGroup,
        record.targetUniversity,
        record.scoreBand,
        record.offers,
        record.rejects,
        record.total,
        record.offerRate
      ]
    );
  }
  await client.query("commit");
} catch (error) {
  await client.query("rollback");
  throw error;
} finally {
  client.release();
}

const count = await pool.query("select count(*)::int as count, sum(offers)::int as offers, sum(rejects)::int as rejects from case_stats");
console.log(JSON.stringify(count.rows[0], null, 2));
await pool.end();
