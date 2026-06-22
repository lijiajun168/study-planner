const APP_DATA = {
  countries: [
    { id: "uk", name: "英国", tone: "tone-uk", note: "重视本科院校分档与均分，商科和计算机竞争较强。" },
    { id: "hk", name: "中国香港", tone: "tone-hk", note: "偏好相关专业背景，港前三热门专业更看重高均分。" },
    { id: "au", name: "澳洲", tone: "tone-au", note: "录取规则更透明，适合做排名优先的稳妥方案。" },
    { id: "ie", name: "爱尔兰", tone: "tone-ie", note: "计算机、数据和商科就业导向强，整体选择灵活。" },
    { id: "sg", name: "新加坡", tone: "tone-sg", note: "名额少、竞争高，建议只推荐高匹配项目。" }
  ],
  tiers: [
    {
      id: "c9",
      label: "C9 / 顶尖985",
      schools: ["清华大学", "北京大学", "复旦大学", "上海交通大学", "浙江大学", "南京大学", "中国科学技术大学", "哈尔滨工业大学", "西安交通大学"]
    },
    {
      id: "985",
      label: "985高校",
      schools: ["中国人民大学", "北京航空航天大学", "北京理工大学", "北京师范大学", "南开大学", "天津大学", "同济大学", "华东师范大学", "东南大学", "武汉大学", "华中科技大学", "中山大学", "华南理工大学", "厦门大学", "山东大学", "四川大学", "电子科技大学", "中南大学", "湖南大学", "重庆大学", "吉林大学", "大连理工大学", "东北大学", "兰州大学", "中国农业大学", "中央民族大学", "西北工业大学", "西北农林科技大学", "国防科技大学"]
    },
    {
      id: "211",
      label: "211 / 双一流高校",
      schools: ["北京交通大学", "北京科技大学", "北京邮电大学", "北京外国语大学", "上海财经大学", "中央财经大学", "对外经济贸易大学", "中国政法大学", "上海大学", "苏州大学", "南京航空航天大学", "南京理工大学", "南京师范大学", "河海大学", "江南大学", "中国矿业大学", "合肥工业大学", "武汉理工大学", "暨南大学", "华南师范大学", "西南财经大学", "西南交通大学", "西安电子科技大学", "郑州大学", "云南大学", "新疆大学", "广西大学", "海南大学"]
    }
  ],
  thresholds: {
    uk: { c9: 78, "985": 80, "211": 83, other: 87 },
    hk: { c9: 80, "985": 82, "211": 85, other: 88 },
    au: { c9: 75, "985": 78, "211": 80, other: 84 },
    ie: { c9: 76, "985": 78, "211": 80, other: 84 },
    sg: { c9: 84, "985": 86, "211": 89, other: 92 }
  },
  majorGroups: {
    business: ["金融", "会计", "经济", "管理", "市场", "商务", "贸易", "工商", "财务"],
    data: ["数据", "统计", "数学", "信息", "计算机", "软件", "人工智能", "电子", "工程"],
    social: ["传媒", "教育", "法律", "社会", "国际关系", "公共", "心理", "语言"],
    engineering: ["机械", "土木", "材料", "化学", "生物", "环境", "能源", "建筑"]
  },
  programs: [
    { country: "uk", university: "Imperial College London", rank: 2, program: "MSc Business Analytics", field: "data", link: "https://www.imperial.ac.uk/business-school/msc/business-analytics/", source: "官网项目页 + 公开版通用初筛规则", floor: { c9: 86, "985": 88, "211": 92, other: 96 } },
    { country: "uk", university: "Imperial College London", rank: 2, program: "MSc Strategic Marketing", field: "business", link: "https://www.imperial.ac.uk/business-school/msc/strategic-marketing/", source: "官网项目页 + 公开版通用初筛规则", floor: { c9: 86, "985": 88, "211": 92, other: 96 } },
    { country: "uk", university: "University of Oxford", rank: 4, program: "MSc Financial Economics", field: "business", link: "https://www.sbs.ox.ac.uk/programmes/masters/msc-financial-economics", source: "官网项目页 + 公开版通用初筛规则", floor: { c9: 88, "985": 88, "211": 93, other: 97 } },
    { country: "uk", university: "University of Cambridge", rank: 6, program: "MPhil in Management", field: "business", link: "https://www.jbs.cam.ac.uk/masters-degrees/mphil-management/", source: "官网项目页 + 公开版通用初筛规则", floor: { c9: 88, "985": 88, "211": 93, other: 97 } },
    { country: "uk", university: "University of Cambridge", rank: 6, program: "MPhil in Technology Policy", field: "data", link: "https://www.jbs.cam.ac.uk/masters-degrees/mphil-technology-policy/", source: "官网项目页 + 公开版通用初筛规则", floor: { c9: 87, "985": 89, "211": 93, other: 97 } },
    { country: "uk", university: "King's College London", rank: 31, program: "International Management MSc", field: "business", link: "https://www.kcl.ac.uk/study/postgraduate-taught/courses/international-management-msc", source: "官网项目页 + 公开版通用初筛规则", floor: { c9: 85, "985": 85, "211": 88, other: 92 } },
    { country: "uk", university: "The University of Manchester", rank: 35, program: "MSc Business Analytics", field: "data", link: "https://www.manchester.ac.uk/study/masters/courses/list/10147/msc-business-analytics-operational-research-and-risk-analysis/", source: "官网项目页 + 公开版通用初筛规则", floor: { c9: 82, "985": 84, "211": 87, other: 91 } },
    { country: "uk", university: "University of Bristol", rank: 51, program: "MSc Management", field: "business", link: "https://www.bristol.ac.uk/study/postgraduate/taught/msc-management/", source: "官网项目页 + 公开版通用初筛规则", floor: { c9: 80, "985": 82, "211": 85, other: 89 } },
    { country: "uk", university: "The University of Warwick", rank: 74, program: "MSc Business Analytics", field: "data", link: "https://warwick.ac.uk/study/postgraduate/courses/businessanalytics/", source: "官网项目页 + 公开版通用初筛规则", floor: { c9: 80, "985": 82, "211": 85, other: 89 } },
    { country: "uk", university: "University of Birmingham", rank: 76, program: "MSc Business Analytics", field: "data", link: "https://www.birmingham.ac.uk/postgraduate/courses/taught/business/business-analytics", source: "官网项目页 + 公开版通用初筛规则", floor: { c9: 78, "985": 80, "211": 83, other: 87 } },
    { country: "uk", university: "University of Glasgow", rank: 79, program: "MSc International Strategic Marketing", field: "business", link: "https://www.gla.ac.uk/postgraduate/taught/internationalstrategicmarketing/", source: "官网项目页 + 公开版通用初筛规则", floor: { c9: 78, "985": 80, "211": 83, other: 87 } },
    { country: "uk", university: "University of Leeds", rank: 86, program: "MSc Business Analytics and Decision Sciences", field: "data", link: "https://courses.leeds.ac.uk/i676/business-analytics-and-decision-sciences-msc", source: "官网项目页 + 公开版通用初筛规则", floor: { c9: 78, "985": 80, "211": 83, other: 88 } },
    { country: "uk", university: "University of Southampton", rank: 87, program: "MSc Business Analytics and Management Sciences", field: "data", link: "https://www.southampton.ac.uk/courses/business-analytics-management-sciences-masters-msc", source: "官网项目页 + 公开版通用初筛规则", floor: { c9: 76, "985": 78, "211": 81, other: 86 } },
    { country: "uk", university: "The University of Sheffield", rank: 92, program: "MSc Data Analytics", field: "data", link: "https://www.sheffield.ac.uk/postgraduate/taught/courses/2026/data-analytics-msc", source: "官网项目页 + 公开版通用初筛规则", floor: { c9: 76, "985": 78, "211": 81, other: 86 } },
    { country: "uk", university: "Durham University", rank: 94, program: "MSc Management", field: "business", link: "https://www.durham.ac.uk/business/courses/management-g5k007/", source: "官网项目页 + 公开版通用初筛规则", floor: { c9: 80, "985": 82, "211": 85, other: 89 } },
    { country: "uk", university: "University of Nottingham", rank: 97, program: "MSc Business Analytics", field: "data", link: "https://www.nottingham.ac.uk/pgstudy/course/taught/business-analytics-msc", source: "官网项目页 + 公开版通用初筛规则", floor: { c9: 76, "985": 78, "211": 81, other: 86 } },
    { country: "uk", university: "Queen Mary University of London", rank: 110, program: "MSc Management", field: "business", link: "https://www.qmul.ac.uk/postgraduate/taught/coursefinder/courses/management-msc/", source: "官网项目页 + 公开版通用初筛规则", floor: { c9: 76, "985": 78, "211": 81, other: 86 } },

    { country: "hk", university: "The University of Hong Kong", rank: 17, program: "MSc Business Analytics", field: "data", link: "https://www.hkubs.hku.hk/tpg/programmes/master-of-science-in-business-analytics/", source: "官网项目页", floor: { c9: 86, "985": 88, "211": 91, other: 95 } },
    { country: "hk", university: "The Chinese University of Hong Kong", rank: 36, program: "MSc in Business Analytics", field: "data", link: "https://masters.bschool.cuhk.edu.hk/programmes/msc-in-business-analytics/", source: "官网项目页", floor: { c9: 84, "985": 86, "211": 89, other: 93 } },
    { country: "hk", university: "The Hong Kong University of Science and Technology", rank: 47, program: "MSc in Information Systems Management", field: "data", link: "https://prog-crs.hkust.edu.hk/pgprog/2024-25/msc-ism", source: "官网项目页", floor: { c9: 84, "985": 86, "211": 89, other: 93 } },
    { country: "hk", university: "City University of Hong Kong", rank: 62, program: "MSc Business and Data Analytics", field: "data", link: "https://www.cityu.edu.hk/pg/programme/p47", source: "官网项目页", floor: { c9: 82, "985": 84, "211": 87, other: 90 } },
    { country: "hk", university: "The Hong Kong Polytechnic University", rank: 57, program: "MSc in Business Analytics", field: "data", link: "https://www.polyu.edu.hk/study/pg/tpg/2024/21047-baf-bfm-bmf-bmm", source: "官网项目页", floor: { c9: 81, "985": 83, "211": 86, other: 90 } },
    { country: "hk", university: "Hong Kong Baptist University", rank: 252, program: "MSc in Data Analytics and Artificial Intelligence", field: "data", link: "https://gs.hkbu.edu.hk/programmes/master-of-science-msc-in-data-analytics-and-artificial-intelligence", source: "官网项目页", floor: { c9: 78, "985": 80, "211": 83, other: 86 } },

    { country: "au", university: "The University of Melbourne", rank: 13, program: "Master of Management", field: "business", link: "https://study.unimelb.edu.au/find/courses/graduate/master-of-management/", source: "官网项目页", floor: { c9: 80, "985": 82, "211": 84, other: 88 } },
    { country: "au", university: "The University of Sydney", rank: 18, program: "Master of Commerce", field: "business", link: "https://www.sydney.edu.au/courses/courses/pc/master-of-commerce.html", source: "官网项目页", floor: { c9: 78, "985": 80, "211": 82, other: 86 } },
    { country: "au", university: "UNSW Sydney", rank: 19, program: "Master of Commerce", field: "business", link: "https://www.unsw.edu.au/study/postgraduate/master-of-commerce", source: "官网项目页", floor: { c9: 78, "985": 80, "211": 82, other: 86 } },
    { country: "au", university: "Australian National University", rank: 30, program: "Master of Applied Data Analytics", field: "data", link: "https://programsandcourses.anu.edu.au/program/MDATA", source: "官网项目页", floor: { c9: 77, "985": 79, "211": 82, other: 86 } },
    { country: "au", university: "Monash University", rank: 37, program: "Master of Business Analytics", field: "data", link: "https://www.monash.edu/study/courses/find-a-course/business-analytics-b6022", source: "官网项目页", floor: { c9: 76, "985": 78, "211": 80, other: 84 } },
    { country: "au", university: "The University of Queensland", rank: 40, program: "Master of Business", field: "business", link: "https://study.uq.edu.au/study-options/programs/master-business-5583", source: "官网项目页", floor: { c9: 75, "985": 77, "211": 80, other: 84 } },

    { country: "ie", university: "Trinity College Dublin", rank: 87, program: "MSc Business Analytics", field: "data", link: "https://www.tcd.ie/courses/postgraduate/courses/business-analytics-msc/", source: "官网项目页", floor: { c9: 80, "985": 82, "211": 84, other: 88 } },
    { country: "ie", university: "University College Dublin", rank: 126, program: "MSc Business Analytics", field: "data", link: "https://www.smurfitschool.ie/programmes/masters/mscinbusinessanalytics/", source: "官网项目页", floor: { c9: 79, "985": 81, "211": 83, other: 87 } },
    { country: "ie", university: "University of Galway", rank: 273, program: "MSc International Management", field: "business", link: "https://www.universityofgalway.ie/courses/taught-postgraduate-courses/international-management.html", source: "官网项目页", floor: { c9: 76, "985": 78, "211": 80, other: 84 } },
    { country: "ie", university: "University College Cork", rank: 273, program: "MSc Business Analytics", field: "data", link: "https://www.ucc.ie/en/ckl33/", source: "官网项目页", floor: { c9: 76, "985": 78, "211": 80, other: 84 } },
    { country: "ie", university: "Dublin City University", rank: 421, program: "MSc in Management", field: "business", link: "https://www.dcu.ie/courses/postgraduate/dcu-business-school/msc-management", source: "官网项目页", floor: { c9: 74, "985": 76, "211": 78, other: 82 } },
    { country: "ie", university: "Maynooth University", rank: 801, program: "MSc Data Science and Analytics", field: "data", link: "https://www.maynoothuniversity.ie/study-maynooth/postgraduate-studies/courses/msc-data-science-and-analytics", source: "官网项目页", floor: { c9: 72, "985": 74, "211": 76, other: 80 } },

    { country: "sg", university: "National University of Singapore", rank: 8, program: "MSc Business Analytics", field: "data", link: "https://msba.nus.edu.sg/", source: "官网项目页", floor: { c9: 90, "985": 92, "211": 95, other: 98 } },
    { country: "sg", university: "Nanyang Technological University", rank: 15, program: "MSc Business Analytics", field: "data", link: "https://www.ntu.edu.sg/business/admissions/graduate-studies/msc-business-analytics", source: "官网项目页", floor: { c9: 88, "985": 90, "211": 93, other: 97 } },
    { country: "sg", university: "Singapore Management University", rank: 585, program: "Master of IT in Business", field: "data", link: "https://masters.smu.edu.sg/programmes/mitb", source: "官网项目页", floor: { c9: 84, "985": 86, "211": 89, other: 93 } },
    { country: "sg", university: "Singapore Management University", rank: 585, program: "MSc in Management", field: "business", link: "https://masters.smu.edu.sg/programmes/mim", source: "官网项目页", floor: { c9: 83, "985": 85, "211": 88, other: 92 } },
    { country: "sg", university: "Singapore University of Technology and Design", rank: 440, program: "MSc Urban Science, Policy and Planning", field: "engineering", link: "https://www.sutd.edu.sg/Admissions/Graduate/Master-of-Science-in-Urban-Science-Policy-and-Planning", source: "官网项目页", floor: { c9: 82, "985": 84, "211": 87, other: 91 } },
    { country: "sg", university: "Singapore Institute of Management", rank: 1200, program: "Postgraduate Business Programmes", field: "business", link: "https://www.sim.edu.sg/degrees-diplomas/programmes", source: "官网项目页", floor: { c9: 78, "985": 80, "211": 83, other: 87 } }
  ]
};
