#!/usr/bin/env python3
"""
初始化技能集合和技能数据

Usage:
    python -m app.scripts.init_skillset          # 初始化（插入种子数据）
    python -m app.scripts.init_skillset --reset  # 先清空再初始化
"""

import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "../"))

from app.database import SessionLocal, engine, Base
from app.models import SkillSet, Skill


# 预定义技能集合配置
SKILL_SETS = [
    {
        "name": "内容创作",
        "description": "文案撰写、内容策划、创意生成",
        "instance_type": "OpenClaw",
        "skill_id": "content",
        "icon": "内",
        "sort_order": 1,
        "skills": [
            {"name": "文案撰写", "description": "各类营销文案、产品介绍、推广软文", "icon": "文", "sort_order": 1},
            {"name": "内容策划", "description": "选题规划、内容框架搭建、发布节奏", "icon": "策", "sort_order": 2},
            {"name": "创意生成", "description": "标题创意、创意故事、视觉文案建议", "icon": "创", "sort_order": 3},
        ],
    },
    {
        "name": "DevOps",
        "description": "CI/CD、容器编排、运维自动化",
        "instance_type": "OpenClaw",
        "skill_id": "devops",
        "icon": "运",
        "sort_order": 2,
        "skills": [
            {"name": "CI/CD 配置", "description": "GitHub Actions、GitLab CI、Jenkins 流水线", "icon": "CI", "sort_order": 1},
            {"name": "容器编排", "description": "Docker Compose、K8s 部署与调试", "icon": "容", "sort_order": 2},
            {"name": "运维自动化", "description": "Shell 脚本、Ansible、巡检与告警", "icon": "运", "sort_order": 3},
        ],
    },
    {
        "name": "学习辅导",
        "description": "知识讲解、习题解答、学习计划",
        "instance_type": "OpenClaw",
        "skill_id": "tutor",
        "icon": "学",
        "sort_order": 3,
        "skills": [
            {"name": "知识讲解", "description": "概念梳理、原理说明、案例分析", "icon": "讲", "sort_order": 1},
            {"name": "习题解答", "description": "选择题、填空题、简答题、代码题", "icon": "答", "sort_order": 2},
            {"name": "学习计划", "description": "学习路径规划、阶段性目标、复习策略", "icon": "计", "sort_order": 3},
        ],
    },
    {
        "name": "通用助手",
        "description": "通用模式，不预设特定技能",
        "instance_type": "OpenClaw",
        "skill_id": "none",
        "icon": "通",
        "sort_order": 4,
        "skills": [
            {"name": "通用对话", "description": "日常问答、信息查询、任务规划", "icon": "对", "sort_order": 1},
            {"name": "代码助手", "description": "代码编写、Review、调试、优化建议", "icon": "码", "sort_order": 2},
            {"name": "数据分析", "description": "数据整理、统计图表、报告生成", "icon": "数", "sort_order": 3},
        ],
    },
]


def init_skillset(reset: bool = False):
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        if reset:
            print("清空现有技能和技能集合数据...")
            db.query(Skill).delete()
            db.query(SkillSet).delete()
            db.commit()
            print("已清空。")

        existing = db.query(SkillSet).count()
        if existing > 0:
            print(f"技能集合已存在（共 {existing} 条），跳过初始化。")
            print("如需重新初始化，请加 --reset 参数：python -m app.scripts.init_skillset --reset")
            return

        print("开始初始化技能集合和技能数据...")
        for ss_conf in SKILL_SETS:
            skills_conf = ss_conf.pop("skills", [])
            skill_set = SkillSet(**ss_conf)
            db.add(skill_set)
            db.flush()

            for sk_conf in skills_conf:
                skill = Skill(skill_set_id=skill_set.id, **sk_conf)
                db.add(skill)

            print(f"  + 技能集合「{ss_conf['name']}」（{len(skills_conf)} 个技能）")

        db.commit()
        print("初始化完成。")

        # 打印汇总
        total_ss = db.query(SkillSet).count()
        total_sk = db.query(Skill).count()
        print(f"当前共有 {total_ss} 个技能集合，{total_sk} 个技能。")

    finally:
        db.close()


if __name__ == "__main__":
    reset = "--reset" in sys.argv or "-r" in sys.argv
    init_skillset(reset=reset)