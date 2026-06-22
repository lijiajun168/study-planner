import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT || 8787);
const API_KEY = process.env.API_KEY || "dev-key";
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || "*";
const CASE_STATS_PATH = process.env.CASE_STATS_PATH || path.join(__dirname, "data", "case-stats.example.json");
const DATABASE_URL = process.env.DATABASE_URL;
const { Pool } = pg;

const countries = ["uk", "hk", "au", "ie", "sg"];
const tiers = {
  c9: "C9 / 顶尖985",
  "985": "985高校",
  "211": "211 / 双一流高校",
  public_non211: "一本双非 / 公办本科",
  private: "三本民办 / 独立学院"
};
const thresholds = {
  uk: { c9: 78, "985": 80, "211": 83, public_non211: 87, private: 90, other: 87 },
  hk: { c9: 80, "985": 82, "211": 85, public_non211: 88, private: 92, other: 88 },
  au: { c9: 75, "985": 78, "211": 80, public_non211: 84, private: 88, other: 84 },
  ie: { c9: 76, "985": 78, "211": 80, public_non211: 84, private: 88, other: 84 },
  sg: { c9: 84, "985": 86, "211": 89, public_non211: 92, private: 96, other: 92 }
};
const majorGroups = {
  business: ["金融", "会计", "经济", "管理", "市场", "商务", "贸易", "工商", "财务", "保险", "供应链", "营销"],
  data: ["数据", "统计", "数学", "信息", "计算机", "软件", "人工智能", "电子", "工程", "系统", "技术"],
  social: ["传媒", "教育", "法律", "社会", "国际关系", "公共", "心理", "语言", "翻译", "新闻"],
  engineering: ["机械", "土木", "材料", "化学", "生物", "环境", "能源", "建筑", "电气", "自动化"],
  arts: ["艺术", "设计", "电影", "影视", "服装", "音乐", "美术", "视觉"]
};
const programs = [
  { country: "uk", university: "Imperial College London", rank: 2, program: "MSc Business Analytics", field: "data", listRestricted: true, link: "https://www.imperial.ac.uk/business-school/msc/business-analytics/", floor: { c9: 86, "985": 88, "211": 92, public_non211: 96, private: 99, other: 96 } },
  { country: "uk", university: "Imperial College London", rank: 2, program: "MSc Strategic Marketing", field: "business", listRestricted: true, link: "https://www.imperial.ac.uk/business-school/msc/strategic-marketing/", floor: { c9: 86, "985": 88, "211": 92, public_non211: 96, private: 99, other: 96 } },
  { country: "uk", university: "University of Oxford", rank: 4, program: "MSc Financial Economics", field: "business", listRestricted: true, link: "https://www.sbs.ox.ac.uk/programmes/masters/msc-financial-economics", floor: { c9: 88, "985": 88, "211": 93, public_non211: 97, private: 99, other: 97 } },
  { country: "uk", university: "University of Cambridge", rank: 6, program: "MPhil in Management", field: "business", listRestricted: true, link: "https://www.jbs.cam.ac.uk/masters-degrees/mphil-management/", floor: { c9: 88, "985": 88, "211": 93, public_non211: 97, private: 99, other: 97 } },
  { country: "uk", university: "King's College London", rank: 31, program: "International Management MSc", field: "business", listRestricted: true, link: "https://www.kcl.ac.uk/study/postgraduate-taught/courses/international-management-msc", floor: { c9: 85, "985": 85, "211": 88, public_non211: 92, private: 96, other: 92 } },
  { country: "uk", university: "The University of Manchester", rank: 35, program: "MSc Business Analytics", field: "data", listRestricted: true, link: "https://www.manchester.ac.uk/study/masters/courses/list/10147/msc-business-analytics-operational-research-and-risk-analysis/", floor: { c9: 82, "985": 84, "211": 87, public_non211: 91, private: 95, other: 91 } },
  { country: "uk", university: "University of Bristol", rank: 51, program: "MSc Management", field: "business", listRestricted: true, link: "https://www.bristol.ac.uk/study/postgraduate/taught/msc-management/", floor: { c9: 80, "985": 82, "211": 85, public_non211: 89, private: 93, other: 89 } },
  { country: "uk", university: "University of Birmingham", rank: 76, program: "MSc Business Analytics", field: "data", link: "https://www.birmingham.ac.uk/postgraduate/courses/taught/business/business-analytics", floor: { c9: 78, "985": 80, "211": 83, public_non211: 87, private: 90, other: 87 } },
  { country: "uk", university: "University of Glasgow", rank: 79, program: "MSc International Strategic Marketing", field: "business", link: "https://www.gla.ac.uk/postgraduate/taught/internationalstrategicmarketing/", floor: { c9: 78, "985": 80, "211": 83, public_non211: 87, private: 90, other: 87 } },
  { country: "uk", university: "University of Southampton", rank: 87, program: "MSc Business Analytics and Management Sciences", field: "data", link: "https://www.southampton.ac.uk/courses/business-analytics-management-sciences-masters-msc", floor: { c9: 76, "985": 78, "211": 81, public_non211: 86, private: 89, other: 86 } },
  { country: "uk", university: "The University of Sheffield", rank: 92, program: "MSc Data Analytics", field: "data", link: "https://www.sheffield.ac.uk/postgraduate/taught/courses/2026/data-analytics-msc", floor: { c9: 76, "985": 78, "211": 81, public_non211: 86, private: 89, other: 86 } },
  { country: "uk", university: "University of Nottingham", rank: 97, program: "MSc Business Analytics", field: "data", link: "https://www.nottingham.ac.uk/pgstudy/course/taught/business-analytics-msc", floor: { c9: 76, "985": 78, "211": 81, public_non211: 86, private: 89, other: 86 } },
  { country: "uk", university: "University of Exeter", rank: 155, program: "MSc International Business", field: "business", link: "https://www.exeter.ac.uk/study/postgraduate/courses/business/internationalbusiness/", floor: { c9: 76, "985": 78, "211": 80, public_non211: 84, private: 88, other: 84 } },
  { country: "uk", university: "Lancaster University", rank: 157, program: "MSc Management", field: "business", link: "https://www.lancaster.ac.uk/study/postgraduate/postgraduate-courses/management-msc/", floor: { c9: 75, "985": 77, "211": 80, public_non211: 84, private: 88, other: 84 } },
  { country: "uk", university: "University of York", rank: 169, program: "MSc Management", field: "business", link: "https://www.york.ac.uk/study/postgraduate-taught/courses/msc-management/", floor: { c9: 75, "985": 77, "211": 80, public_non211: 84, private: 88, other: 84 } },
  { country: "uk", university: "Cardiff University", rank: 181, program: "MSc Business Strategy and Entrepreneurship", field: "business", link: "https://www.cardiff.ac.uk/study/postgraduate/taught/courses/course/business-strategy-and-entrepreneurship-msc", floor: { c9: 74, "985": 76, "211": 79, public_non211: 83, private: 87, other: 83 } },
  { country: "uk", university: "Queen's University Belfast", rank: 199, program: "MSc Business Analytics", field: "data", link: "https://www.qub.ac.uk/courses/postgraduate-taught/business-analytics-msc/", floor: { c9: 74, "985": 76, "211": 79, public_non211: 82, private: 86, other: 82 } }
];

let caseStats = { source: "empty", summary: { offers: 0, rejects: 0, groups: 0 }, records: [] };
let dbPool = null;

async function ensureCaseStatsSchema(pool) {
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
}

async function refreshPostgresSummary() {
  const summary = await dbPool.query(
    "select count(*)::int as groups, coalesce(sum(offers),0)::int as offers, coalesce(sum(rejects),0)::int as rejects from case_stats"
  );
  caseStats = { source: "postgres", summary: summary.rows[0], records: [] };
}

async function importCaseStatsToPostgres(payload) {
  if (!dbPool) throw new Error("DATABASE_URL is not configured");
  const records = Array.isArray(payload.records) ? payload.records : [];
  await ensureCaseStatsSchema(dbPool);
  const client = await dbPool.connect();
  try {
    await client.query("begin");
    await client.query("truncate table case_stats");
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
  await refreshPostgresSummary();
  return caseStats.summary;
}

async function loadCaseStats() {
  if (DATABASE_URL) {
    dbPool = new Pool({ connectionString: DATABASE_URL, ssl: { rejectUnauthorized: false } });
    await ensureCaseStatsSchema(dbPool);
    await refreshPostgresSummary();
    return;
  }

  try {
    caseStats = JSON.parse(fs.readFileSync(CASE_STATS_PATH, "utf8"));
  } catch (error) {
    console.warn(`Case stats unavailable at ${CASE_STATS_PATH}: ${error.message}`);
  }
}

await loadCaseStats();

function sendJson(res, status, data, origin) {
  res.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "access-control-allow-origin": ALLOWED_ORIGIN === "*" ? (origin || "*") : ALLOWED_ORIGIN,
    "access-control-allow-methods": "GET,POST,OPTIONS",
    "access-control-allow-headers": "content-type,x-api-key"
  });
  res.end(JSON.stringify(data));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
      if (body.length > 1024 * 1024) reject(new Error("Request body too large"));
    });
    req.on("end", () => resolve(body ? JSON.parse(body) : {}));
    req.on("error", reject);
  });
}

function requireAuth(req) {
  return req.headers["x-api-key"] === API_KEY;
}

function detectMajorGroup(major = "") {
  for (const [group, keywords] of Object.entries(majorGroups)) {
    if (keywords.some((keyword) => major.includes(keyword))) return group;
  }
  return "other";
}

function normalizeTier(input) {
  return tiers[input] ? input : "public_non211";
}

function scoreBand(score) {
  const low = Math.floor(Number(score) / 5) * 5;
  return `${low}-${low + 4}`;
}

async function getCaseSignal(program, tier, majorGroup, score) {
  const band = scoreBand(score);
  let rows = [];
  if (dbPool) {
    const result = await dbPool.query(
      `select offers, rejects, total, offer_rate
       from case_stats
       where school_type = $1 and major_group = $2 and target_university = $3 and score_band in ($4, 'unknown')`,
      [tier, majorGroup, program.university, band]
    );
    rows = result.rows.map((row) => ({
      offers: Number(row.offers),
      rejects: Number(row.rejects),
      total: Number(row.total),
      offerRate: Number(row.offer_rate)
    }));
  } else {
    rows = (caseStats.records || []).filter((record) => {
      return record.schoolType === tier &&
        record.majorGroup === majorGroup &&
        record.targetUniversity === program.university &&
        (record.scoreBand === band || record.scoreBand === "unknown");
    });
  }
  const total = rows.reduce((sum, record) => sum + record.total, 0);
  const offers = rows.reduce((sum, record) => sum + record.offers, 0);
  const rejects = rows.reduce((sum, record) => sum + record.rejects, 0);
  if (!total) return { total: 0, offers: 0, rejects: 0, offerRate: null, score: 0 };
  const offerRate = offers / total;
  const confidence = Math.min(20, total * 1.4);
  return { total, offers, rejects, offerRate, score: (offerRate - 0.5) * confidence };
}

async function recommend(input) {
  const country = countries.includes(input.country) ? input.country : "uk";
  const tier = normalizeTier(input.schoolType);
  const majorGroup = detectMajorGroup(input.major || "");
  const score = Number(input.score);
  if (!Number.isFinite(score)) throw new Error("score must be a number");

  const base = thresholds[country][tier] ?? thresholds[country].other;
  const results = await Promise.all(programs
    .filter((program) => program.country === country)
    .map(async (program) => {
      const floor = Math.max(program.floor[tier] ?? program.floor.other, base - 3);
      const delta = score - floor;
      const blocked = program.country === "uk" && program.listRestricted === true && tier === "private";
      const matched = program.field === majorGroup;
      const caseSignal = await getCaseSignal(program, tier, majorGroup, score);
      const rankScore = Math.max(0, 1400 - program.rank) / 14;
      const feasibility = delta * 10 + (matched ? 18 : -8) + (blocked ? -160 : 0) + caseSignal.score;
      return {
        university: program.university,
        program: program.program,
        rank: program.rank,
        link: program.link,
        floor,
        total: feasibility + rankScore,
        delta: Number(delta.toFixed(1)),
        fit: program.rank <= 10 && delta >= 0 ? "高排名优选" : delta >= 5 && matched ? "高匹配" : delta >= 0 ? "可申请" : "冲刺",
        documentBand: program.listRestricted ? "名单限制项目" : "接受范围较宽",
        caseSignal,
        reason: `${matched ? "专业方向匹配" : "专业方向需补充相关经历"}，均分${delta >= 0 ? "高于" : "低于"}当前规则线 ${Math.abs(delta).toFixed(1)} 分。`
      };
    }));

  return results
    .filter((item) => item.delta >= -3 && !(item.documentBand === "名单限制项目" && tier === "private"))
    .sort((a, b) => {
      const aAdmissible = a.delta >= 0 ? 1 : 0;
      const bAdmissible = b.delta >= 0 ? 1 : 0;
      if (aAdmissible !== bAdmissible) return bAdmissible - aAdmissible;
      if (a.rank !== b.rank) return a.rank - b.rank;
      return b.total - a.total;
    })
    .slice(0, 6);
}

const server = http.createServer(async (req, res) => {
  const origin = req.headers.origin;
  if (req.method === "OPTIONS") return sendJson(res, 204, {}, origin);
  if (req.url === "/api/health" && req.method === "GET") {
    return sendJson(res, 200, { ok: true, caseStats: caseStats.summary, allowedOrigin: ALLOWED_ORIGIN }, origin);
  }
  if (req.url === "/api/recommend" && req.method === "POST") {
    if (!requireAuth(req)) return sendJson(res, 401, { error: "Unauthorized" }, origin);
    try {
      const input = await readBody(req);
      return sendJson(res, 200, { results: await recommend(input), caseStats: caseStats.summary }, origin);
    } catch (error) {
      return sendJson(res, 400, { error: error.message }, origin);
    }
  }
  if (req.url === "/api/admin/import-case-stats" && req.method === "POST") {
    if (!requireAuth(req)) return sendJson(res, 401, { error: "Unauthorized" }, origin);
    try {
      const payload = await readBody(req);
      const summary = await importCaseStatsToPostgres(payload);
      return sendJson(res, 200, { ok: true, caseStats: summary }, origin);
    } catch (error) {
      return sendJson(res, 400, { error: error.message }, origin);
    }
  }
  return sendJson(res, 404, { error: "Not found" }, origin);
});

server.listen(PORT, () => {
  console.log(`Private API listening on http://127.0.0.1:${PORT}`);
});
