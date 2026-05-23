# 云数据库设计文档

## 一、数据库选择

**微信云开发数据库**（MongoDB）
- 免费额度：1000次/天读取，500次/天写入
- 适合小程序，无需单独部署后端
- 数据随用户账号同步，换手机不丢失

---

## 二、表结构设计

### 2.1 persons（人员表）

| 字段 | 类型 | 说明 |
|------|------|------|
| `_id` | ObjectId | 自动生成，唯一标识 |
| `name` | string | 姓名备注（如"小明妈妈"） |
| `gender` | string | 男/女 |
| `recipientType` | string | 家长/老师/同学 |
| `avatar` | string | 头像颜色（随机分配） |
| `createdAt` | Date | 创建时间 |
| `updatedAt` | Date | 最后更新时间 |
| `analysisCount` | number | 分析次数 |
| `stableType` | string | 稳定属性（置信度>70%） |
| `currentType` | string | 当前判断属性（最新） |
| `confidence` | number | 置信度（0-100） |
| `historySummary` | string | 历史摘要（AI生成的综合判断） |
| `lastAnalysis` | object | 最后一次分析的摘要 |

**索引**：`name`（姓名）, `createdAt`（创建时间）

### 2.2 analyses（分析记录表）

| 字段 | 类型 | 说明 |
|------|------|------|
| `_id` | ObjectId | 自动生成，唯一标识 |
| `personId` | ObjectId | 关联人员ID |
| `personName` | string | 人员姓名（冗余） |
| `userMessage` | string | 对方发送的话术 |
| `result` | object | 完整分析结果 |
| `qingzhiType` | string | 情直属性 |
| `mbtiType` | string | MBTI |
| `attachmentType` | string | 依恋类型 |
| `satirStance` | string | 萨提亚沟通姿态 |
| `eqLevel` | string | 情商水平 |
| `sdtNeed` | string | SDT需求 |
| `createdAt` | Date | 分析时间 |

**索引**：`personId`（人员ID）, `createdAt`（分析时间）

---

## 三、属性趋近机制

### 3.1 置信度计算

```
初始置信度 = 20%（第1次分析）
每次分析后更新：
- 属性一致：confidence += 20%（上限90%）
- 属性变化：confidence = max(confidence - 10%, 20%)
- 多次一致后稳定：confidence >= 70% 标记为"稳定"
```

### 3.2 历史摘要生成

每次分析后，AI生成新的历史摘要：
```
【{姓名}历史分析】
- 已分析{次数}次
- 属性变化趋势：{属性A} → {属性B}
- 沟通特点：{总结}
- 关键事件：{最近一次分析的关键发现}
- 当前判断：{属性}（置信度{百分比}%）
```

### 3.3 趋近稳定判定

```
分析次数 >= 3
且 当前属性连续出现 >= 2次
且 置信度 >= 70%
→ 标记为"稳定"
```

---

## 四、API设计

### 4.1 人员管理

| 接口 | 方法 | 说明 |
|------|------|------|
| `/api/persons/list` | GET | 获取人员列表 |
| `/api/persons/create` | POST | 创建新人 |
| `/api/persons/update` | POST | 更新人员信息 |
| `/api/persons/delete` | POST | 删除人员 |
| `/api/persons/detail` | GET | 获取人员详情+历史 |

### 4.2 分析管理

| 接口 | 方法 | 说明 |
|------|------|------|
| `/api/analyze` | POST | 执行分析（关联到人） |
| `/api/analyses/history` | GET | 获取某人的分析历史 |
| `/api/analyses/latest` | GET | 获取最新分析 |

### 4.3 数据格式

**创建人员**：
```json
POST /api/persons/create
{
  "name": "小明妈妈",
  "gender": "女",
  "recipientType": "家长"
}
```

**执行分析**：
```json
POST /api/analyze
{
  "userMessage": "孩子最近成绩有点下滑",
  "userText": "",
  "recipientType": "家长",
  "gender": "女",
  "personId": "xxxxxxxx",  // 可选，不传则创建新人
  "personName": "小明妈妈"  // 可选
}
```

**返回结果**：
```json
{
  "success": true,
  "data": {
    "person": {
      "_id": "xxx",
      "name": "小明妈妈",
      "currentType": "攻情女",
      "confidence": 65,
      "isStable": false
    },
    "analysis": {
      "qingzhiType": "攻情女",
      ...
    },
    "historySummary": "【小明妈妈历史分析】已分析2次..."
  }
}
```

---

## 五、前端页面规划

### 5.1 页面结构

```
pages/
├── index/          # 分析主页（不变，加入姓名输入）
├── history/        # 分析历史（改为按人聚合）
├── persons/         # 👥 人员列表（新页面）
├── personDetail/   # 人员详情+历史（新页面）
└── settings/       # 设置（不变）
```

### 5.2 人员列表页（persons）

展示内容：
- 人员头像（颜色+姓名首字）
- 姓名
- 当前属性 + 置信度
- 分析次数
- 稳定标记（星星）
- 最后分析时间

排序：按最后更新时间倒序

### 5.3 人员详情页（personDetail）

展示内容：
- 人员信息卡
- 属性判断（当前属性 + 置信度进度条）
- 历史摘要
- 分析记录列表（每次分析的时间+话术+结果）
- 添加分析按钮

---

## 六、现有数据迁移

当前历史记录存储在 `wx.getStorageSync('chatHistory')` 中：
- 需要一个迁移脚本
- 将历史记录导入云数据库
- 建立人员与分析的关联

---
创建时间：2026-05-21