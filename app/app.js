const state = {
  country: null,
  student: null
};

const views = {
  country: document.querySelector("#countryView"),
  form: document.querySelector("#formView"),
  result: document.querySelector("#resultView")
};

const countryGrid = document.querySelector("#countryGrid");
const selectedCountryLabel = document.querySelector("#selectedCountryLabel");
const form = document.querySelector("#studentForm");
const recommendations = document.querySelector("#recommendations");
const resultTitle = document.querySelector("#resultTitle");
const resultCountry = document.querySelector("#resultCountry");
const profileSummary = document.querySelector("#profileSummary");
const apiUrlInput = document.querySelector("#apiUrl");
const apiKeyInput = document.querySelector("#apiKey");
const saveApiSettings = document.querySelector("#saveApiSettings");

function showView(name) {
  Object.values(views).forEach((view) => view.classList.remove("active"));
  views[name].classList.add("active");
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function loadApiSettings() {
  const settings = JSON.parse(localStorage.getItem("studyPlannerApi") || "{}");
  const defaultApiUrl = "https://study-planner-api-l583.onrender.com";
  const savedUrl = settings.url === "https://study-planner-fiq3.onrender.com" ? defaultApiUrl : settings.url;
  if (apiUrlInput) apiUrlInput.value = savedUrl || defaultApiUrl;
  if (apiKeyInput) apiKeyInput.value = settings.key || "";
}

function getApiSettings() {
  return {
    url: (apiUrlInput?.value || "").replace(/\/$/, ""),
    key: apiKeyInput?.value || ""
  };
}

function persistApiSettings() {
  const settings = getApiSettings();
  localStorage.setItem("studyPlannerApi", JSON.stringify(settings));
}

async function recommendWithPrivateApi(student, countryId) {
  const settings = getApiSettings();
  if (!settings.url || !settings.key) return null;
  const response = await fetch(`${settings.url}/api/recommend`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": settings.key
    },
    body: JSON.stringify({
      country: countryId,
      school: student.university,
      schoolType: resolveTier(student.university, student.schoolType).id,
      major: student.major,
      score: student.score,
      notes: student.notes
    })
  });
  if (!response.ok) throw new Error(`API ${response.status}`);
  const payload = await response.json();
  return Array.isArray(payload.results) ? payload.results : null;
}

function getCountry(id) {
  return APP_DATA.countries.find((country) => country.id === id);
}

function normalizeSchoolName(name) {
  return name.replace(/\s/g, "").replace(/[（）()]/g, "");
}

function detectTier(university) {
  const normalized = normalizeSchoolName(university);
  if (/独立学院|民办/.test(university)) {
    return { id: "private", label: "民办三本 / 独立学院", inferred: true };
  }
  for (const tier of APP_DATA.tiers) {
    if (tier.schools.some((school) => normalizeSchoolName(school) === normalized)) {
      return { id: tier.id, label: tier.label };
    }
  }
  return { id: "public_top200", label: "双非一本 / 中国前200（需名单复核）", inferred: true };
}

function normalizeTierId(id) {
  if (id === "public_non211") return "public_top200";
  return id || "public_top200";
}

function resolveTier(university, schoolType) {
  const detected = detectTier(university);
  const selected = normalizeTierId(schoolType);
  if (!selected || selected === "auto") return detected;
  const labels = {
    c9: "C9 / 顶尖985",
    "985": "985高校",
    "211": "211 / 双一流高校",
    public_top200: "双非一本 / 中国前200",
    public_non_top200: "公办二本 / 非前200",
    private: "民办三本 / 独立学院"
  };
  return { id: selected, label: labels[selected] || detected.label, manual: true };
}

function detectMajorGroup(major) {
  const value = major.trim();
  for (const [group, keywords] of Object.entries(APP_DATA.majorGroups)) {
    if (keywords.some((keyword) => value.includes(keyword))) {
      return group;
    }
  }
  return "business";
}

function detectSpecialNeeds(notes) {
  const value = (notes || "").trim();
  return {
    text: value,
    transfer: /转专业|跨专业|换专业|非本专业|无相关背景/.test(value)
  };
}

function isHotMajor(majorGroup) {
  return majorGroup === "business" || majorGroup === "data";
}

function isBroadSocialMajor(majorGroup) {
  return majorGroup === "social" || majorGroup === "arts";
}

function isEliteTier(tierId) {
  return tierId === "c9" || tierId === "985" || tierId === "211";
}

function allowsLowerTierTop100(program, majorGroup) {
  const allowedUniversities = ["University of Southampton", "University of Nottingham", "University of Birmingham"];
  return program.country === "uk" && program.rank <= 100 && isBroadSocialMajor(majorGroup) && allowedUniversities.includes(program.university);
}

function fitText(delta, majorMatched, rank) {
  if (rank <= 10 && delta >= 0) return "高排名优选";
  if (rank <= 100 && delta >= 0) return "前100匹配";
  if (delta >= 5 && majorMatched) return "高匹配";
  if (delta >= 2) return "较稳妥";
  return "可申请";
}

function scoreBand(score) {
  if (!Number.isFinite(score)) return "unknown";
  const low = Math.floor(score / 5) * 5;
  return `${low}-${low + 4}`;
}

function getCaseSignal(program, tier, majorGroup, score) {
  if (typeof CASE_STATS === "undefined" || !Array.isArray(CASE_STATS.records)) {
    return { total: 0, offers: 0, rejects: 0, offerRate: null, score: 0 };
  }
  const band = scoreBand(score);
  const matches = CASE_STATS.records.filter((record) => {
    return record.schoolType === tier.id &&
      record.majorGroup === majorGroup &&
      record.targetUniversity === program.university &&
      (record.scoreBand === band || record.scoreBand === "unknown");
  });
  const total = matches.reduce((sum, record) => sum + record.total, 0);
  const offers = matches.reduce((sum, record) => sum + record.offers, 0);
  const rejects = matches.reduce((sum, record) => sum + record.rejects, 0);
  if (!total) return { total: 0, offers: 0, rejects: 0, offerRate: null, score: 0 };
  const offerRate = offers / total;
  const confidence = Math.min(18, total * 1.5);
  return {
    total,
    offers,
    rejects,
    offerRate,
    score: (offerRate - 0.5) * confidence
  };
}

function buildReason(program, student, tier, majorGroup, specialNeeds) {
  const delta = student.score - program.floor;
  const majorMatched = program.field === majorGroup;
  const subjectText = majorMatched ? "专业方向匹配" : "专业方向需补充相关经历";
  const scoreText = `均分达到当前规则线，并高出 ${delta.toFixed(1)} 分`;
  const transferText = specialNeeds.transfer ? "学生有转专业诉求，建议优先补充相关课程、实习、项目经历，并避开明确强限制本科背景的项目。" : "";
  return `${subjectText}，${scoreText}。该项目已通过院校名单/背景规则筛选，并按可申请范围内的学校排名优先推荐。${transferText}`;
}

function resolveProgramRule(program, tier, majorGroup, countryId) {
  const tierId = normalizeTierId(tier.id);
  const baseThreshold = APP_DATA.thresholds[countryId][tierId] ?? APP_DATA.thresholds[countryId].other;
  const tierFloor = program.floor[tierId] ?? program.floor.public_non211 ?? program.floor.other ?? baseThreshold;
  let floor = Math.max(tierFloor, baseThreshold - 3);
  let accepted = true;
  let note = "";

  if (program.country === "uk") {
    if (isEliteTier(tierId)) {
      if (isHotMajor(majorGroup)) floor = Math.max(floor, 85);
      if (isBroadSocialMajor(majorGroup)) floor = Math.max(floor, program.rank <= 100 ? 80 : 70);
    }

    if (tierId === "public_top200" && program.listRestricted) {
      note = "双非一本按英国院校认可名单复核；公开规则只在达到名单项目分数线时推荐。";
    }

    if (tierId === "public_non_top200" || tierId === "private") {
      if (program.rank <= 100 && !allowsLowerTierTop100(program, majorGroup)) {
        accepted = false;
        note = "公办二本/民办三本通常不进入该类前100名单项目，系统不强行匹配。";
      } else if (program.rank <= 100) {
        floor = Math.max(tierFloor, 82);
        note = "该前100选项仅限文科社科等相对宽口径方向，并需逐项复核院校名单。";
      }
    }
  }

  return {
    floor,
    source: program.source,
    documentBand: program.listRestricted ? "名单限制项目" : "接受范围较宽",
    accepted,
    note
  };
}

function recommend(student, countryId) {
  const tier = resolveTier(student.university, student.schoolType);
  const majorGroup = detectMajorGroup(student.major);
  const specialNeeds = detectSpecialNeeds(student.notes);

  return APP_DATA.programs
    .filter((program) => program.country === countryId)
    .map((program) => {
      const rule = resolveProgramRule(program, tier, majorGroup, countryId);
      const delta = student.score - rule.floor;
      const majorMatched = program.field === majorGroup;
      const caseSignal = getCaseSignal(program, tier, majorGroup, student.score);
      const rankScore = Math.max(0, 1400 - program.rank) / 14;
      const matchScore = majorMatched ? 18 : -8;
      const total = rankScore + matchScore + Math.min(12, Math.max(-8, caseSignal.score));
      const item = {
        ...program,
        floor: rule.floor,
        ruleSource: rule.source,
        documentBand: rule.documentBand,
        ruleNote: rule.note,
        acceptedByDocument: rule.accepted,
        caseSignal,
        delta,
        majorMatched,
        tier,
        total,
        fit: fitText(delta, majorMatched, program.rank)
      };
      item.reason = buildReason(item, student, tier, majorGroup, specialNeeds);
      return item;
    })
    .filter((program) => program.delta >= 0 && program.acceptedByDocument !== false)
    .sort((a, b) => {
      if (a.rank !== b.rank) return a.rank - b.rank;
      if (a.majorMatched !== b.majorMatched) return a.majorMatched ? -1 : 1;
      return b.total - a.total;
    })
    .slice(0, 6);
}

function renderCountries() {
  countryGrid.innerHTML = APP_DATA.countries
    .map(
      (country) => `
        <button class="country-card ${country.tone}" type="button" data-country="${country.id}">
          <strong>${country.name}</strong>
          <span>${country.note}</span>
        </button>
      `
    )
    .join("");
}

function renderResults(results, student, country) {
  const tier = resolveTier(student.university, student.schoolType);
  resultCountry.textContent = `${country.name} · 推荐结果`;
  resultTitle.textContent = `${student.nickname} 的 6 所学校专业方案`;
  const notesText = student.notes ? `特殊说明：${student.notes}。` : "";
  profileSummary.textContent = `${student.university}，${student.major}，均分 ${student.score.toFixed(1)}。${notesText}系统识别为 ${tier.label}，优先展示符合院校名单与分数线后排名更靠前的项目。`;

  recommendations.innerHTML = results
    .map(
      (item, index) => `
        <article class="recommendation-card">
          <div class="rank-row">
            <span class="rank">${index + 1}</span>
            <span class="fit">${item.fit}</span>
          </div>
          <div>
            <h3>${item.university}</h3>
            <p>${item.program}</p>
          </div>
          <div class="meta">
            <span>排名参考：${item.rank}</span>
            <span>规则线：${item.floor}</span>
            <span>${item.documentBand}</span>
            ${item.caseSignal && item.caseSignal.total ? `<span>相似案例：${item.caseSignal.total}，录取率 ${Math.round(item.caseSignal.offerRate * 100)}%</span>` : ""}
          </div>
          <p>${item.reason}</p>
          <p>规则来源：${item.ruleSource || item.source}</p>
          <a class="program-link" href="${item.link}" target="_blank" rel="noreferrer">查看专业链接</a>
        </article>
      `
    )
    .join("");

  if (!results.length) {
    recommendations.innerHTML = `
      <article class="recommendation-card">
        <h3>暂无符合规则的匹配</h3>
        <p>当前背景下没有同时满足名单规则与分数线的项目。建议提高均分、补充相关经历，或选择排名区间更宽的院校。</p>
      </article>
    `;
  }
}

loadApiSettings();
renderCountries();

saveApiSettings?.addEventListener("click", () => {
  persistApiSettings();
  saveApiSettings.textContent = "已保存";
  window.setTimeout(() => {
    saveApiSettings.textContent = "保存设置";
  }, 1400);
});

countryGrid.addEventListener("click", (event) => {
  const card = event.target.closest("[data-country]");
  if (!card) return;
  state.country = card.dataset.country;
  selectedCountryLabel.textContent = `目标地区 · ${getCountry(state.country).name}`;
  showView("form");
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const formData = new FormData(form);
  state.student = {
    nickname: formData.get("nickname").trim(),
    university: formData.get("university").trim(),
    schoolType: formData.get("schoolType"),
    major: formData.get("major").trim(),
    score: Number(formData.get("score")),
    notes: formData.get("notes").trim()
  };
  persistApiSettings();
  const country = getCountry(state.country);
  let results = null;
  try {
    results = await recommendWithPrivateApi(state.student, state.country);
  } catch (error) {
    console.warn("Private API unavailable, using local rules", error);
  }
  if (!results) results = recommend(state.student, state.country);
  renderResults(results, state.student, country);
  showView("result");
});

document.querySelector("#backToCountries").addEventListener("click", () => showView("country"));
document.querySelector("#editInfo").addEventListener("click", () => showView("form"));
document.querySelector("#restart").addEventListener("click", () => {
  state.country = null;
  state.student = null;
  form.reset();
  showView("country");
});
