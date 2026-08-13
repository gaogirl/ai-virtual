const crypto = require('crypto');
const User = require('./models/User');
const Term = require('./models/Term');
const Case = require('./models/Case');
const Class = require('./models/Class');
const Assignment = require('./models/Assignment');
const Submission = require('./models/Submission');

const terms = [
  { term: 'Consecutive interpreting', meaning: '交替传译：讲话者停顿后，译员根据笔记分段传译。', cat: '口译模式' },
  { term: 'Simultaneous interpreting', meaning: '同声传译：译员几乎同步地将源语转换为目标语。', cat: '口译模式' },
  { term: 'Sight translation', meaning: '视译：阅读书面源语材料并即时口头译为目标语。', cat: '口译模式' },
  { term: 'Source language', meaning: '源语：原始讲话或文本所使用的语言。', cat: '基础概念' },
  { term: 'Target language', meaning: '目标语：翻译或口译输出所使用的语言。', cat: '基础概念' },
  { term: 'Register', meaning: '语域：根据场合、对象和目的形成的语言风格与正式程度。', cat: '语言能力' },
  { term: 'Equivalence', meaning: '对等：译文在意义、功能或效果上与原文保持相应关系。', cat: '翻译理论' },
  { term: 'Localization', meaning: '本地化：根据目标地区的语言、文化和使用习惯调整内容。', cat: '翻译技术' },
  { term: 'Terminology management', meaning: '术语管理：收集、审核、统一并维护专业术语的过程。', cat: '翻译技术' },
  { term: 'Active listening', meaning: '主动倾听：有目的地识别讲话结构、重点、态度和隐含信息。', cat: '口译技巧' },
  { term: 'Note-taking symbols', meaning: '口译笔记符号：用简洁符号记录逻辑关系、数字和核心信息。', cat: '口译技巧' },
  { term: 'Decalage', meaning: '耳口时差：同传中听到源语与输出目标语之间的时间间隔。', cat: '口译技巧' }
];

const cases = [
  {
    title: '商务谈判中的交替传译',
    domain: '商务',
    summary: '围绕交付周期、价格条件和售后责任进行中英双向交替传译。',
    tags: ['商务谈判', '交替传译', '数字信息'],
    content: `## 场景\n一家制造企业与海外采购商讨论年度采购合同。\n\n## 任务\n准确传递数量、币种、付款节点和违约责任，避免擅自弱化双方立场。\n\n## 观察重点\n- 数字、日期和百分比应单独记录。\n- 对模糊表达及时请求澄清。\n- 保持正式、克制的商务语域。`
  },
  {
    title: '国际门诊初次接诊',
    domain: '医疗',
    summary: '协助医生询问症状、既往史、过敏史并说明检查安排。',
    tags: ['医疗口译', '隐私', '风险沟通'],
    content: `## 场景\n外籍患者因持续腹痛到医院就诊，需要完成病史采集。\n\n## 任务\n完整传递疼痛位置、持续时间、药物过敏和既往治疗信息。\n\n## 观察重点\n- 不自行给出医学判断。\n- 保留患者语气中的不确定性。\n- 涉及剂量和频次时必须复核。`
  },
  {
    title: '国际教育论坛同声传译准备',
    domain: '会议',
    summary: '根据议程和演讲稿建立术语表，并规划同传中的信息分段。',
    tags: ['同声传译', '会前准备', '教育'],
    content: `## 场景\n论坛主题为人工智能与课堂评价，发言包含政策名称和技术术语。\n\n## 任务\n在会前完成背景研究、讲者信息整理和双语术语表。\n\n## 观察重点\n- 统一 curriculum、assessment、learning analytics 等术语。\n- 预测长句中的逻辑关系。\n- 对专有名词准备可靠译法。`
  },
  {
    title: '校园开放日陪同口译',
    domain: '教育',
    summary: '陪同国际学生家庭参观校园并解释课程、住宿和奖学金政策。',
    tags: ['陪同口译', '校园交流', '政策说明'],
    content: `## 场景\n国际学生家庭参加校园开放日，与招生老师和在校生交流。\n\n## 任务\n传递课程设置、申请条件、住宿规则和奖学金信息。\n\n## 观察重点\n- 使用自然、友好的口语表达。\n- 区分建议、规定和承诺。\n- 遇到未确认政策时引导咨询负责人。`
  },
  {
    title: '城市文化线路导览',
    domain: '旅游',
    summary: '为小型旅行团讲解历史街区、地方习俗和参观注意事项。',
    tags: ['旅游口译', '文化负载词', '公众表达'],
    content: `## 场景\n译员陪同游客参观历史街区和非遗展馆。\n\n## 任务\n用目标受众容易理解的方式解释历史背景和文化概念。\n\n## 观察重点\n- 文化负载词可采用解释性翻译。\n- 避免堆砌年代和人名。\n- 安全提醒应简短、明确并重复关键限制。`
  }
];

async function seedDemoData() {
  const demoUsers = [
    { name: '演示教师', email: 'teacher@demo.local', password: 'Demo123456', role: 'teacher' },
    { name: '演示学生', email: 'student@demo.local', password: 'Demo123456', role: 'student' }
  ];

  for (const user of demoUsers) {
    const existing = await User.findOne({ email: user.email });
    if (!existing) {
      await User.create(user);
    }
  }

  const teacher = await User.findOne({ email: 'teacher@demo.local' });
  const student = await User.findOne({ email: 'student@demo.local' });
  const demoClass = await Class.findOneAndUpdate(
    { name: '2026 春季口译实训班', teacher: teacher._id },
    {
      $setOnInsert: {
        subject: '英汉口译',
        period: '第 1-16 周',
        invite: { code: 'DEMO26', maxUses: 0, usedCount: 1 },
      },
      $addToSet: { members: student._id },
    },
    { new: true, upsert: true }
  );

  const conferenceAssignment = await Assignment.findOneAndUpdate(
    { class: demoClass._id, title: '国际会议开幕致辞口译' },
    {
      $setOnInsert: {
        createdBy: teacher._id,
        type: 'en-zh',
        retryLimit: 2,
        allowViewRef: true,
        questions: [{
          type: 'en-zh',
          promptText: 'Distinguished delegates, cooperation and mutual trust remain essential to addressing shared global challenges.',
          referenceAnswer: '各位尊敬的代表，合作与互信仍是应对全球共同挑战的关键。',
          difficulty: '中级',
          topic: '国际会议',
          knowledgeTags: ['正式语域', '逻辑衔接'],
        }],
      },
    },
    { new: true, upsert: true }
  );

  await Assignment.findOneAndUpdate(
    { class: demoClass._id, title: '商务谈判数字信息训练' },
    {
      $setOnInsert: {
        createdBy: teacher._id,
        type: 'zh-en',
        retryLimit: 3,
        allowViewRef: false,
        questions: [{
          type: 'zh-en',
          promptText: '首批订单为两万件，交付周期为合同生效后的四十五天。',
          referenceAnswer: 'The initial order is 20,000 units, with delivery due within 45 days after the contract takes effect.',
          difficulty: '中级',
          topic: '商务谈判',
          knowledgeTags: ['数字信息', '交付条款'],
        }],
      },
    },
    { new: true, upsert: true }
  );

  await Submission.findOneAndUpdate(
    { assignment: conferenceAssignment._id, student: student._id },
    {
      $setOnInsert: {
        status: 'graded',
        attempts: 1,
        totalScore: 84,
        comment: '信息完整，正式语域处理较好；继续加强术语使用和长句流畅度。',
        answers: [{
          index: 0,
          text: '各位代表，合作与相互信任对于解决共同的全球挑战仍然十分重要。',
          score: 84,
          feedback: '准确性较好，术语使用基本恰当；可进一步提升表达流畅度。',
        }],
      },
    },
    { new: true, upsert: true }
  );

  let seedUser = await User.findOne({ email: 'seed@demo.local' });
  if (!seedUser) {
    seedUser = await User.create({
      name: 'Demo Data Owner',
      email: 'seed@demo.local',
      password: crypto.randomBytes(24).toString('hex'),
      role: 'teacher'
    });
  }

  await Term.bulkWrite(terms.map(item => ({
    updateOne: {
      filter: { term: item.term },
      update: { $setOnInsert: { ...item, createdBy: seedUser._id } },
      upsert: true
    }
  })));

  await Case.bulkWrite(cases.map(item => ({
    updateOne: {
      filter: { title: item.title },
      update: { $setOnInsert: { ...item, createdBy: seedUser._id } },
      upsert: true
    }
  })));

  console.log(`Demo data ready: ${terms.length} terms, ${cases.length} cases, 1 class and 2 assignments.`);
}

module.exports = { seedDemoData };
