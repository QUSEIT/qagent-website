from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, declarative_base

from app.config import settings

engine = create_engine(
    settings.database_url,
    connect_args={"check_same_thread": False} if settings.database_url.startswith("sqlite") else {},
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    Base.metadata.create_all(bind=engine)
    if settings.database_url.startswith("sqlite"):
        with engine.connect() as conn:
            result = conn.execute(text("PRAGMA table_info(users)"))
            columns = [row[1] for row in result]
            if "max_instances" not in columns:
                conn.execute(text("ALTER TABLE users ADD COLUMN max_instances INTEGER DEFAULT 0"))
                conn.commit()
            if "qagent_skill_template" not in columns:
                conn.execute(text("ALTER TABLE users ADD COLUMN qagent_skill_template VARCHAR(50)"))
                conn.commit()
            if "qagent_instance_name" not in columns:
                conn.execute(text("ALTER TABLE users ADD COLUMN qagent_instance_name VARCHAR(100)"))
                conn.commit()

            result = conn.execute(text("PRAGMA table_info(instances)"))
            inst_columns = [row[1] for row in result]
            if "default_provider" not in inst_columns:
                conn.execute(text("ALTER TABLE instances ADD COLUMN default_provider VARCHAR(50)"))
                conn.commit()
            if "cpu_cores" not in inst_columns:
                conn.execute(text("ALTER TABLE instances ADD COLUMN cpu_cores REAL DEFAULT 1.0"))
                conn.commit()
            if "memory_gb" not in inst_columns:
                conn.execute(text("ALTER TABLE instances ADD COLUMN memory_gb INTEGER DEFAULT 4"))
                conn.commit()
            if "disk_gb" not in inst_columns:
                conn.execute(text("ALTER TABLE instances ADD COLUMN disk_gb INTEGER DEFAULT 20"))
                conn.commit()

            result = conn.execute(text("PRAGMA table_info(feishu_channels)"))
            feishu_columns = [row[1] for row in result]
            if "status" not in feishu_columns:
                conn.execute(text("ALTER TABLE feishu_channels ADD COLUMN status VARCHAR(20) DEFAULT 'pending'"))
                conn.commit()

            result = conn.execute(text("PRAGMA table_info(qq_channels)"))
            qq_columns = [row[1] for row in result]
            if "status" not in qq_columns:
                conn.execute(text("ALTER TABLE qq_channels ADD COLUMN status VARCHAR(20) DEFAULT 'pending'"))
                conn.commit()

            result = conn.execute(text("PRAGMA table_info(skill_sets)"))
            skill_sets_columns = [row[1] for row in result]
            if "clawmanager_skill_id" not in skill_sets_columns:
                conn.execute(text("ALTER TABLE skill_sets ADD COLUMN clawmanager_skill_id INTEGER"))
                conn.commit()

            # Migrate legacy single-instance data to instances table
            result = conn.execute(text("SELECT name FROM sqlite_master WHERE type='table' AND name='instances'"))
            if result.fetchone():
                existing = conn.execute(text(
                    "SELECT id, qagent_instance_id, qagent_instance_name, qagent_instance_type, qagent_skill_template "
                    "FROM users WHERE qagent_instance_id IS NOT NULL"
                )).fetchall()
                for row in existing:
                    user_id, cm_id, name, inst_type, skill = row
                    # Check if already migrated
                    check = conn.execute(
                        text("SELECT 1 FROM instances WHERE user_id = :uid AND clawmanager_instance_id = :cmid"),
                        {"uid": user_id, "cmid": cm_id}
                    ).fetchone()
                    if not check:
                        conn.execute(
                            text(
                                "INSERT INTO instances (user_id, clawmanager_instance_id, name, instance_type, skill_template) "
                                "VALUES (:uid, :cmid, :name, :itype, :skill)"
                            ),
                            {
                                "uid": user_id,
                                "cmid": cm_id,
                                "name": name or "我的 QAgent",
                                "itype": inst_type or "OpenClaw",
                                "skill": skill,
                            },
                        )
                conn.commit()
