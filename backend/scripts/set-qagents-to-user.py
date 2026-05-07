#!/usr/bin/env python3
"""Set the max_instances (QAgent quota) for a user.

Usage:
    python set-qagents-to-user.py <username> <max_instances>

Example:
    python set-qagents-to-user.py alice 3
"""

import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.config import settings
from app.models import User


def main() -> None:
    if len(sys.argv) != 3:
        print(f"Usage: {sys.argv[0]} <username> <max_instances>")
        sys.exit(1)

    username = sys.argv[1]
    try:
        max_instances = int(sys.argv[2])
    except ValueError:
        print("Error: <max_instances> must be an integer")
        sys.exit(1)

    engine = create_engine(
        settings.database_url,
        connect_args={"check_same_thread": False}
        if settings.database_url.startswith("sqlite")
        else {},
    )
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = SessionLocal()

    try:
        user = db.query(User).filter(User.username == username).first()
        if not user:
            print(f"Error: User '{username}' not found")
            sys.exit(1)

        old_value = user.max_instances
        user.max_instances = max_instances
        db.commit()

        print(
            f"Updated user '{username}': max_instances {old_value} -> {max_instances}"
        )
    finally:
        db.close()


if __name__ == "__main__":
    main()
