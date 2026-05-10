# 技能集合数据初始化

## 功能说明

`backend/app/scripts/init_skillset.py` 用于初始化技能集合（SkillSet）和技能（Skill）数据。

当前数据对应前端预设技能模板：

| 技能ID | 技能集合名称 | 实例类型 | 包含技能 |
|--------|-------------|-----------|---------|
| `content` | 内容创作 | OpenClaw | 文案撰写、内容策划、创意生成 |
| `devops` | DevOps | OpenClaw | CI/CD 配置、容器编排、运维自动化 |
| `tutor` | 学习辅导 | OpenClaw | 知识讲解、习题解答、学习计划 |
| `none` | 通用助手 | OpenClaw | 通用对话、代码助手、数据分析 |

## 运行方式

项目根目录下执行：

```bash
# 首次初始化（幂等，已存在则跳过）
PYTHONPATH=backend ./backend/venv/bin/python -m app.scripts.init_skillset

# 重新初始化（先清空再插入）
PYTHONPATH=backend ./backend/venv/bin/python -m app.scripts.init_skillset --reset
```

## 数据库表结构

### skill_sets（技能集合）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER | 主键，自增 |
| name | VARCHAR(100) | 集合名称 |
| description | VARCHAR(500) | 描述 |
| instance_type | VARCHAR(50) | 实例类型（OpenClaw/HermesAgent） |
| skill_id | VARCHAR(50) | 关联前端 SKILL_TEMPLATES 的 id |
| icon | VARCHAR(10) | 图标（取首字符） |
| sort_order | INTEGER | 排序 |
| created_at | DATETIME | 创建时间 |

### skills（技能）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER | 主键，自增 |
| skill_set_id | INTEGER | 外键，关联 skill_sets |
| name | VARCHAR(100) | 技能名称 |
| description | VARCHAR(500) | 描述 |
| icon | VARCHAR(10) | 图标 |
| sort_order | INTEGER | 排序 |
| created_at | DATETIME | 创建时间 |