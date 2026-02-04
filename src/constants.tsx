
import { Question } from './types';

// 五维度配置
export const DIMENSIONS = {
  work: { name: '打工人现状', questions: [4, 5, 6, 7, 8, 9, 10, 11, 12], maxScore: 63 },
  social: { name: '社交电量', questions: [13, 14, 15, 16, 17, 18, 19], maxScore: 49 },
  life: { name: '生活状态', questions: [20, 21, 22, 23, 24, 25, 26, 27], maxScore: 56 },
  mental: { name: '精神状态', questions: [28, 29, 30, 31, 32, 33], maxScore: 42 },
  value: { name: '价值观念', questions: [34, 35, 36, 37, 38], maxScore: 35 }
};

// 等级配置
export const LEVELS = [
  { min: 35, max: 70, level: 'Lv.1', name: '卷王本王', emoji: '💪', description: '还在相信"努力就有回报"的稀有物种' },
  { min: 71, max: 105, level: 'Lv.2', name: '奋斗挣扎型', emoji: '📈', description: '在努力和放弃之间反复横跳' },
  { min: 106, max: 140, level: 'Lv.3', name: '佛系青年', emoji: '🧘', description: '"都行、可以、没事"三连本尊' },
  { min: 141, max: 175, level: 'Lv.4', name: '躺平预备役', emoji: '😑', description: '"下辈子当猫吧"挂嘴边' },
  { min: 176, max: 210, level: 'Lv.5', name: '资深躺平家', emoji: '🛌', description: '已在精神上退休，肉身还在苦苦支撑' },
  { min: 211, max: 245, level: 'Lv.6', name: '躺平祖师爷', emoji: '🏖️', description: '人生赢家（指赢麻了的麻）' }
];

// 基础信息选项描述
export const BASE_INFO_DESC = {
  city: {
    'A': '一线城市，呼吸都要钱',
    'B': '新一线/强二线，卷得刚刚好',
    'C': '二三线，温饱有余精致不足',
    'D': '小城/家乡，物价亲切如初恋'
  },
  career: {
    'A': '职场萌新（<2年）',
    'B': '熟练工（2-5年）',
    'C': '资深选手（5-10年）',
    'D': '职场"老师傅"（10年+）',
    'E': '自由职业/灵活就业',
    'F': '在校/待业中'
  },
  sleep: {
    'A': '婴儿般的睡眠（指半夜醒三次）',
    'B': '靠褪黑素续命',
    'C': '周末补觉型选手',
    'D': '倒头就睡，雷打不动'
  }
};

export const QUESTIONS: Question[] = [
  // ========== 前置基础信息（3题）- 不计入总分 ==========
  {
    id: 1,
    text: '你的城市生活成本等级？',
    type: 'CHOICE',
    isBaseInfo: true,
    options: [
      { value: 0, label: '一线城市，呼吸都要钱' },
      { value: 0, label: '新一线/强二线，卷得刚刚好' },
      { value: 0, label: '二三线，温饱有余精致不足' },
      { value: 0, label: '小城/家乡，物价亲切如初恋' }
    ]
  },
  {
    id: 2,
    text: '你现在的"打工人"阶段？',
    type: 'CHOICE',
    isBaseInfo: true,
    options: [
      { value: 0, label: '职场萌新（<2年）' },
      { value: 0, label: '熟练工（2-5年）' },
      { value: 0, label: '资深选手（5-10年）' },
      { value: 0, label: '职场"老师傅"（10年+）' },
      { value: 0, label: '自由职业/灵活就业' },
      { value: 0, label: '在校/待业中' }
    ]
  },
  {
    id: 3,
    text: '你最近的睡眠质量？',
    type: 'CHOICE',
    isBaseInfo: true,
    options: [
      { value: 0, label: '婴儿般的睡眠（指半夜醒三次）' },
      { value: 0, label: '靠褪黑素续命' },
      { value: 0, label: '周末补觉型选手' },
      { value: 0, label: '倒头就睡，雷打不动' }
    ]
  },

  // ========== 模块一：打工人现状（9题：Q4-Q12）==========
  {
    id: 4,
    text: '早上闹钟响起的那一刻，你的内心OS是？',
    type: 'CHOICE',
    module: '打工人现状',
    options: [
      { value: 1, label: '新的一天，冲鸭！' },
      { value: 3, label: '唉，又要上班了' },
      { value: 5, label: '让我再睡5分钟...' },
      { value: 7, label: '为什么人要工作，我不想当人了' }
    ]
  },
  {
    id: 5,
    text: '领导在周末群里@所有人时，你第一反应？',
    type: 'CHOICE',
    module: '打工人现状',
    options: [
      { value: 1, label: '秒回"收到，马上处理"' },
      { value: 3, label: '半小时后回复"好的"' },
      { value: 5, label: '周一早上再回' },
      { value: 7, label: '已读不回，假装信号不好' }
    ]
  },
  {
    id: 6,
    text: '关于老板画的"饼"，你现在的状态是？',
    type: 'CHOICE',
    module: '打工人现状',
    options: [
      { value: 1, label: '还是会心动，万一是真的呢' },
      { value: 3, label: '表面点头，心里计算跳槽倒计时' },
      { value: 5, label: '饼都吃饱了，谢谢' },
      { value: 7, label: '领导一张嘴，我就想辞职' }
    ]
  },
  {
    id: 7,
    text: '周五下午5点，临时任务来了',
    type: 'CHOICE',
    module: '打工人现状',
    options: [
      { value: 1, label: '没问题，周末也能做' },
      { value: 3, label: '好的，但周一交行吗' },
      { value: 5, label: '"网不好，没收到"' },
      { value: 7, label: '已读不回，周一见' }
    ]
  },
  {
    id: 8,
    text: '你的工位现在是什么样？',
    type: 'CHOICE',
    module: '打工人现状',
    options: [
      { value: 1, label: '整洁专业，绿植手办齐全' },
      { value: 3, label: '还算整齐，基本用品都有' },
      { value: 5, label: '乱糟糟的，但我知道东西在哪' },
      { value: 7, label: '空无一物，随时可以跑路' }
    ]
  },
  {
    id: 9,
    text: '同事升职了，你的真实想法？',
    type: 'CHOICE',
    module: '打工人现状',
    options: [
      { value: 1, label: '我也可以！继续努力' },
      { value: 3, label: '替TA开心，有点小羡慕' },
      { value: 5, label: '无所谓，反正也轮不到我' },
      { value: 7, label: '升职=更累，不升也挺好' }
    ]
  },
  {
    id: 10,
    text: '公司团建通知来了',
    type: 'CHOICE',
    module: '打工人现状',
    options: [
      { value: 1, label: '耶！可以认识新朋友' },
      { value: 3, label: '去吧，反正不花钱' },
      { value: 5, label: '能请假吗？我有事' },
      { value: 7, label: '为什么要占用我的休息时间' }
    ]
  },
  {
    id: 11,
    text: '你对"副业刚需"的看法？',
    type: 'CHOICE',
    module: '打工人现状',
    options: [
      { value: 1, label: '已在经营，多线发展' },
      { value: 3, label: '正在探索，还没找到合适的' },
      { value: 5, label: '想过，但主业已耗尽精力' },
      { value: 7, label: '主业都不想干，还副业？' }
    ]
  },
  {
    id: 12,
    text: '你对"35岁危机"的态度？',
    type: 'CHOICE',
    module: '打工人现状',
    options: [
      { value: 1, label: '焦虑，正在疯狂积累资本' },
      { value: 3, label: '担忧，但相信船到桥头自然直' },
      { value: 5, label: '无所谓，计划35岁前退休' },
      { value: 7, label: '已经提前进入退休心态' }
    ]
  },

  // ========== 模块二：社交电量（7题：Q13-Q19）==========
  {
    id: 13,
    text: '周末有朋友约你出去玩',
    type: 'CHOICE',
    module: '社交电量',
    options: [
      { value: 1, label: '好呀好呀，去哪儿？' },
      { value: 3, label: '看地方，不远的话可以' },
      { value: 5, label: '下次吧，这周有点累' },
      { value: 7, label: '能在微信聊就别见面了' }
    ]
  },
  {
    id: 14,
    text: '你的微信群现在？',
    type: 'CHOICE',
    module: '社交电量',
    options: [
      { value: 1, label: '经常发言，群聊小活跃份子' },
      { value: 3, label: '偶尔冒泡' },
      { value: 5, label: '潜水观众，从不发言' },
      { value: 7, label: '退群/屏蔽了一大半' }
    ]
  },
  {
    id: 15,
    text: '过年回家，亲戚问东问西',
    type: 'CHOICE',
    module: '社交电量',
    options: [
      { value: 1, label: '耐心回答，分享近况' },
      { value: 3, label: '简单应付，转移话题' },
      { value: 5, label: '能躲就躲，躲不掉就尬笑' },
      { value: 7, label: '直接不回家了' }
    ]
  },
  {
    id: 16,
    text: '恋爱对你来说？',
    type: 'CHOICE',
    module: '社交电量',
    options: [
      { value: 1, label: '好想谈！积极社交中' },
      { value: 3, label: '遇到合适的再说' },
      { value: 5, label: '一个人挺好的，不想折腾' },
      { value: 7, label: '光是想想就觉得好累' }
    ]
  },
  {
    id: 17,
    text: '你的朋友圈是？',
    type: 'CHOICE',
    module: '社交电量',
    options: [
      { value: 1, label: '经常发，记录生活' },
      { value: 3, label: '偶尔发，看心情' },
      { value: 5, label: '设置三天可见了' },
      { value: 7, label: '基本不发，或者只发给自己看' }
    ]
  },
  {
    id: 18,
    text: '你上次主动联系老朋友是？',
    type: 'CHOICE',
    module: '社交电量',
    options: [
      { value: 1, label: '最近' },
      { value: 3, label: '半年内' },
      { value: 5, label: '想不起来了' },
      { value: 7, label: '通讯录都删得差不多了' }
    ]
  },
  {
    id: 19,
    text: '收到别人的活动邀请（婚礼、聚会等）',
    type: 'CHOICE',
    module: '社交电量',
    options: [
      { value: 1, label: '开心赴约，准备礼物' },
      { value: 3, label: '看关系，重要的会去' },
      { value: 5, label: '随个红包，人就不去了' },
      { value: 7, label: '能推就推，实在不行装病' }
    ]
  },

  // ========== 模块三：生活状态（8题：Q20-Q27）==========
  {
    id: 20,
    text: '你的一日三餐',
    type: 'CHOICE',
    module: '生活状态',
    options: [
      { value: 1, label: '规律饮食，自己做或好好吃' },
      { value: 3, label: '能对付就对付' },
      { value: 5, label: '外卖+便利店，随便吃点' },
      { value: 7, label: '经常忘记吃饭或不想吃' }
    ]
  },
  {
    id: 21,
    text: '打开外卖App的历史订单',
    type: 'CHOICE',
    module: '生活状态',
    options: [
      { value: 1, label: '什么都点，挺丰富' },
      { value: 3, label: '常点的就那几家' },
      { value: 5, label: '都是优惠的、便宜的' },
      { value: 7, label: '清一色黄焖鸡/麻辣烫/米线' }
    ]
  },
  {
    id: 22,
    text: '你的购物车里现在都是？',
    type: 'CHOICE',
    module: '生活状态',
    options: [
      { value: 1, label: '护肤品/新衣服/好玩的东西' },
      { value: 3, label: '日用品为主' },
      { value: 5, label: '收藏了很多，但不会买' },
      { value: 7, label: '购物车都空了，无欲无求' }
    ]
  },
  {
    id: 23,
    text: '周末宅家的标准姿势',
    type: 'CHOICE',
    module: '生活状态',
    options: [
      { value: 1, label: '做做家务，看看书，挺充实' },
      { value: 3, label: '补觉+追剧' },
      { value: 5, label: '躺床上刷手机一整天' },
      { value: 7, label: '除了上厕所，其他时间都在床上' }
    ]
  },
  {
    id: 24,
    text: '最近有运动吗？',
    type: 'CHOICE',
    module: '生活状态',
    options: [
      { value: 1, label: '有规律的运动习惯' },
      { value: 3, label: '偶尔运动' },
      { value: 5, label: '只有从床到厕所的距离' },
      { value: 7, label: '运动？不存在的' }
    ]
  },
  {
    id: 25,
    text: '你的作息时间',
    type: 'CHOICE',
    module: '生活状态',
    options: [
      { value: 1, label: '基本规律' },
      { value: 3, label: '偶尔熬夜' },
      { value: 5, label: '报复性熬夜常客' },
      { value: 7, label: '作息完全乱了，什么时候困什么时候睡' }
    ]
  },
  {
    id: 26,
    text: '照镜子的时候觉得自己？',
    type: 'CHOICE',
    module: '生活状态',
    options: [
      { value: 1, label: '还不错，保持得挺好' },
      { value: 3, label: '凑合吧' },
      { value: 5, label: '怎么又胖了/憔悴了' },
      { value: 7, label: '能不照镜子就不照' }
    ]
  },
  {
    id: 27,
    text: '你上一次主动学习新技能是？',
    type: 'CHOICE',
    module: '生活状态',
    options: [
      { value: 1, label: '最近' },
      { value: 3, label: '半年内' },
      { value: 5, label: '想不起来了' },
      { value: 7, label: '学习？已经毕业了' }
    ]
  },

  // ========== 模块四：精神状态（6题：Q28-Q33）==========
  {
    id: 28,
    text: '最近的口头禅是？',
    type: 'CHOICE',
    module: '精神状态',
    options: [
      { value: 1, label: '"冲！""可以！"' },
      { value: 3, label: '"还行吧""还好"' },
      { value: 5, label: '"好累啊""算了吧"' },
      { value: 7, label: '"麻了""摆了""毁灭吧"' }
    ]
  },
  {
    id: 29,
    text: '刷到成功学/励志内容时',
    type: 'CHOICE',
    module: '精神状态',
    options: [
      { value: 1, label: '会认真看，觉得有道理' },
      { value: 3, label: '看看就过' },
      { value: 5, label: '心里一万个白眼' },
      { value: 7, label: '直接取关/屏蔽，不想看' }
    ]
  },
  {
    id: 30,
    text: '你现在的快乐来源主要是？',
    type: 'CHOICE',
    module: '精神状态',
    options: [
      { value: 1, label: '工作成就/个人进步' },
      { value: 3, label: '和朋友相处' },
      { value: 5, label: '短视频/游戏/追剧' },
      { value: 7, label: '下班/放假/发工资' }
    ]
  },
  {
    id: 31,
    text: '看到"xx岁实现财富自由"的新闻',
    type: 'CHOICE',
    module: '精神状态',
    options: [
      { value: 1, label: '我也要努力！' },
      { value: 3, label: '挺好的，但是跟我没关系' },
      { value: 5, label: '又是别人家的孩子' },
      { value: 7, label: '呵呵，肯定有矿' }
    ]
  },
  {
    id: 32,
    text: '你的焦虑程度？',
    type: 'CHOICE',
    module: '精神状态',
    options: [
      { value: 1, label: '还好，压力可控' },
      { value: 3, label: '有时候会焦虑' },
      { value: 5, label: '经常焦虑到睡不着' },
      { value: 7, label: '焦虑到麻木了/直接破罐破摔' }
    ]
  },
  {
    id: 33,
    text: '对未来的感觉？',
    type: 'CHOICE',
    module: '精神状态',
    options: [
      { value: 1, label: '充满希望' },
      { value: 3, label: '不好不坏' },
      { value: 5, label: '有点迷茫，不知道会怎样' },
      { value: 7, label: '不敢想，想了更难受' }
    ]
  },

  // ========== 模块五：价值观念（5题：Q34-Q38）==========
  {
    id: 34,
    text: '你认为成功的定义是？',
    type: 'CHOICE',
    module: '价值观念',
    options: [
      { value: 1, label: '事业有成，财务自由' },
      { value: 3, label: '家庭幸福，生活平衡' },
      { value: 5, label: '内心平静，自我实现' },
      { value: 7, label: '开心就好，其他随缘' }
    ]
  },
  {
    id: 35,
    text: '你对"努力一定成功"的态度？',
    type: 'CHOICE',
    module: '价值观念',
    options: [
      { value: 1, label: '深信不疑，持续努力' },
      { value: 3, label: '努力是必要条件，但不是充分条件' },
      { value: 5, label: '选择比努力更重要' },
      { value: 7, label: '努力不一定成功，但不努力一定很轻松' }
    ]
  },
  {
    id: 36,
    text: '关于买房',
    type: 'CHOICE',
    module: '价值观念',
    options: [
      { value: 1, label: '正在为首付努力' },
      { value: 3, label: '有这个打算，慢慢来' },
      { value: 5, label: '想都不敢想' },
      { value: 7, label: '这辈子不考虑了' }
    ]
  },
  {
    id: 37,
    text: '你如何处理"同辈压力"？',
    type: 'CHOICE',
    module: '价值观念',
    options: [
      { value: 1, label: '转化为动力，督促自己进步' },
      { value: 3, label: '选择性比较，保持平常心' },
      { value: 5, label: '屏蔽外界信息，专注自己' },
      { value: 7, label: '直接放弃比较，彻底躺平' }
    ]
  },
  {
    id: 38,
    text: '如果中了100万',
    type: 'CHOICE',
    module: '价值观念',
    options: [
      { value: 1, label: '拿去投资/创业' },
      { value: 3, label: '一半存着，一半改善生活' },
      { value: 5, label: '辞职休息一段时间' },
      { value: 7, label: '直接躺平，能花多久花多久' }
    ]
  },

  // ========== 开放题（3题：Q39-Q41）==========
  {
    id: 39,
    text: '如果完全不用考虑现实限制（金钱、能力、他人看法），你理想中的一天是怎样的？',
    type: 'OPEN',
    module: '开放题'
  },
  {
    id: 40,
    text: '用最近常刷到的一句话/一个梗，形容一下你现在的状态？',
    type: 'OPEN',
    module: '开放题'
  },
  {
    id: 41,
    text: '填空题：让我【坚持/放弃】的理由是______',
    type: 'OPEN',
    module: '开放题'
  }
];

export const MOCK_VALID_CODE = "TANG2025";
