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

function showView(name) {
  Object.values(views).forEach((view) => view.classList.remove("active"));
  views[name].classList.add("active");
  window.scrollTo({ top: 0, behavior: "smooth" });
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
    return { id: "private", label: "三本民办 / 独立学院", inferred: true };
  }
  for (const tier of APP_DATA.tiers) {
    if (tier.schools.some((school) => normalizeSchoolName(school) === normalized)) {
      return { id: tier.id, label: tier.label };
    }
  }
  return { id: "public_non211", label: "一本双非 / 公办本科", inferred: true };
}

function resolveTier(university, schoolType) {
  const detected = detectTier(university);
  if (!schoolType || schoolType === "auto") return detected;
  const labels = {
    "985": "985高校",
    "211": "211 / 双一流高校",
    public_non211: "一本双非 / 公办本科",
    private: "三本民办 / 独立学院"
  };
  return { id: schoolType, label: labels[schoolType] || detected.label, manual: true };
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

function fitText(delta, majorMatched, rank) {
  if (rank <= 10 && delta >= 0) return "高排名优选";
  if (rank <= 10 && delta >= -3) return "高排名冲刺";
  if (delta >= 5 && majorMatched) return "高匹配";
  if (delta >= 2) return "较稳妥";
  if (delta >= 0) return "可申请";
  return "冲刺";
}

function buildReason(program, student, tier, majorGroup, specialNeeds) {
  const floor = program.floor;
  const delta = student.score - floor;
  const majorMatched = program.field === majorGroup;
  const subjectText = majorMatched ? "专业方向匹配" : "专业方向需补充相关经历";
  const scoreText = delta >= 0 ? `均分高于当前规则线 ${delta.toFixed(1)} 分` : `均分低于当前规则线 ${Math.abs(delta).toFixed(1)} 分`;
  const transferText = specialNeeds.transfer ? "学生有转专业诉求，建议优先补充相关课程、实习、项目经历，并避开明确强限制本科背景的项目。" : "";
  return `${subjectText}，${scoreText}。按学校排名优先排序后，该项目属于当前背景下更靠前且具备可操作性的选择。${transferText}`;
}

function resolveProgramRule(program, tier) {
  const baseFloor = program.floor[tier.id] ?? program.floor.other + (tier.id === "private" ? 3 : 0);
  const listBlocked = program.country === "uk" && program.listRestricted === true && tier.id === "private";
  return {
    floor: baseFloor,
    source: program.source,
    documentBand: program.listRestricted ? "名单限制项目" : "接受范围较宽",
    accepted: !listBlocked
  };
}

function recommend(student, countryId) {
  const tier = resolveTier(student.university, student.schoolType);
  const majorGroup = detectMajorGroup(student.major);
  const specialNeeds = detectSpecialNeeds(student.notes);
  const base = APP_DATA.thresholds[countryId][tier.id] ?? APP_DATA.thresholds[countryId].other;

  return APP_DATA.programs
    .filter((program) => program.country === countryId)
    .map((program) => {
      const rule = resolveProgramRule(program, tier);
      const floor = Math.max(rule.floor, base - 3);
      const delta = student.score - floor;
      const majorMatched = program.field === majorGroup;
      const feasibility = delta * 10 + (majorMatched ? 18 : -8) + (rule.accepted ? 0 : -160);
      const rankScore = Math.max(0, 1400 - program.rank) / 14;
      const total = feasibility + rankScore;
      return {
        ...program,
        floor,
        ruleSource: rule.source,
        documentBand: rule.documentBand,
        ruleNote: rule.note,
        acceptedByDocument: rule.accepted,
        delta,
        majorMatched,
        tier,
        total,
        fit: fitText(delta, majorMatched, program.rank),
        reason: buildReason(program, student, tier, majorGroup, specialNeeds)
      };
    })
    .filter((program) => program.delta >= -3 && program.acceptedByDocument !== false)
    .sort((a, b) => {
      const aAdmissible = a.delta >= 0 ? 1 : 0;
      const bAdmissible = b.delta >= 0 ? 1 : 0;
      if (aAdmissible !== bAdmissible) return bAdmissible - aAdmissible;
      if (a.rank !== b.rank) return a.rank - b.rank;
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
  profileSummary.textContent = `${student.university}，${student.major}，均分 ${student.score.toFixed(1)}。${notesText}系统识别为 ${tier.label}，优先展示排名更靠前且规则线匹配度更高的项目。`;

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
        <h3>暂无稳妥匹配</h3>
        <p>当前分数和地区组合没有达到可推荐阈值。建议提高均分、补充语言成绩和相关经历，或选择竞争略低的地区。</p>
      </article>
    `;
  }
}

renderCountries();

countryGrid.addEventListener("click", (event) => {
  const card = event.target.closest("[data-country]");
  if (!card) return;
  state.country = card.dataset.country;
  selectedCountryLabel.textContent = `目标地区 · ${getCountry(state.country).name}`;
  showView("form");
});

form.addEventListener("submit", (event) => {
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
  const country = getCountry(state.country);
  const results = recommend(state.student, state.country);
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
