#!/usr/bin/env python3
"""Seed a user into the database for testing."""
import sys
sys.path.insert(0, "/home/quseit/Projects/qagent-website/backend")

from app.database import SessionLocal, init_db
from app.models import User
from app.auth import get_password_hash


def seed_user(username: str, email: str, password: str, max_instances: int = 0):
    init_db()
    db = SessionLocal()
    try:
        existing = db.query(User).filter(User.username == username).first()
        if existing:
            existing.max_instances = max_instances
            db.commit()
            print(f"Updated {username}: max_instances={max_instances}")
            return

        user = User(
            username=username,
            email=email,
            password_hash=get_password_hash(password),
            max_instances=max_instances,
        )
        db.add(user)
        db.commit()
        print(f"Created {username}: max_instances={max_instances}")
    finally:
        db.close()


if __name__ == "__main__":
    if len(sys.argv) < 2:
        seed_user("river", "river@example.com", "river123", max_instances=5)
    else:
        username = sys.argv[1]
        email = sys.argv[2] if len(sys.argv) > 2 else f"{username}@example.com"
        password = sys.argv[3] if len(sys.argv) > 3 else "password123"
        max_inst = int(sys.argv[4]) if len(sys.argv) > 4 else 5
        seed_user(username, email, password, max_inst)
