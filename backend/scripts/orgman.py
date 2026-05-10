#!/usr/bin/env python3
"""Organization management script: add, delete, modify organizations."""
import sys
import argparse
from datetime import datetime, date

sys.path.insert(0, "/home/quseit/Projects/qagent-website/backend")

from app.database import SessionLocal, init_db
from app.models import Organization


def _db():
    init_db()
    return SessionLocal()


def cmd_add(args):
    db = _db()
    try:
        existing = db.query(Organization).filter(Organization.code == args.code).first()
        if existing:
            print(f"Organization with code '{args.code}' already exists.")
            return

        org = Organization(
            code=args.code,
            name=args.name,
            user_count=0,
            instance_count=0,
            created_date=args.created_date or date.today(),
            expired_at=args.expired_date,
        )
        db.add(org)
        db.commit()
        print(f"Added organization: code={args.code}, name={args.name}")
    finally:
        db.close()


def cmd_delete(args):
    db = _db()
    try:
        org = db.query(Organization).filter(Organization.code == args.code).first()
        if not org:
            print(f"Organization with code '{args.code}' not found.")
            return

        db.delete(org)
        db.commit()
        print(f"Deleted organization: code={args.code}")
    finally:
        db.close()


def cmd_modify(args):
    db = _db()
    try:
        org = db.query(Organization).filter(Organization.code == args.code).first()
        if not org:
            print(f"Organization with code '{args.code}' not found.")
            return

        if args.name is not None:
            org.name = args.name
        if args.user_count is not None:
            org.user_count = args.user_count
        if args.instance_count is not None:
            org.instance_count = args.instance_count
        if args.expired_date is not None:
            org.expired_at = args.expired_date

        db.commit()
        print(f"Modified organization: code={args.code}")
    finally:
        db.close()


def cmd_list(args):
    db = _db()
    try:
        orgs = db.query(Organization).all()
        if not orgs:
            print("No organizations found.")
            return
        for org in orgs:
            expired = org.expired_at or "N/A"
            print(f"{org.code} | {org.name} | users={org.user_count} | instances={org.instance_count} | created={org.created_date} | expired={expired}")
    finally:
        db.close()


def cmd_get(args):
    db = _db()
    try:
        org = db.query(Organization).filter(Organization.code == args.code).first()
        if not org:
            print(f"Organization with code '{args.code}' not found.")
            return
        print(f"Code: {org.code}")
        print(f"Name: {org.name}")
        print(f"User count: {org.user_count}")
        print(f"Instance count: {org.instance_count}")
        print(f"Created date: {org.created_date}")
        print(f"Expired at: {org.expired_at or 'N/A'}")
    finally:
        db.close()


def main():
    parser = argparse.ArgumentParser(description="Organization management")
    sub = parser.add_subparsers(dest="cmd", required=True)

    p_add = sub.add_parser("add", help="Add an organization")
    p_add.add_argument("--code", required=True, help="Organization code (unique)")
    p_add.add_argument("--name", required=True, help="Organization name")
    p_add.add_argument("--created-date", type=lambda s: datetime.strptime(s, "%Y-%m-%d").date(), default=None, dest="created_date", help="Created date (YYYY-MM-DD)")
    p_add.add_argument("--expired-date", type=lambda s: datetime.strptime(s, "%Y-%m-%d").date(), default=None, dest="expired_date", help="Expired date (YYYY-MM-DD)")
    p_add.set_defaults(func=cmd_add)

    p_del = sub.add_parser("del", help="Delete an organization")
    p_del.add_argument("--code", required=True, help="Organization code")
    p_del.set_defaults(func=cmd_delete)

    p_mod = sub.add_parser("modify", help="Modify an organization")
    p_mod.add_argument("--code", required=True, help="Organization code")
    p_mod.add_argument("--name", help="New organization name")
    p_mod.add_argument("--user-count", type=int, dest="user_count", help="Set user count")
    p_mod.add_argument("--instance-count", type=int, dest="instance_count", help="Set instance count")
    p_mod.add_argument("--expired-date", type=lambda s: datetime.strptime(s, "%Y-%m-%d").date(), dest="expired_date", help="Set expired date (YYYY-MM-DD)")
    p_mod.set_defaults(func=cmd_modify)

    p_list = sub.add_parser("list", help="List all organizations")
    p_list.set_defaults(func=cmd_list)

    p_get = sub.add_parser("get", help="Get organization details")
    p_get.add_argument("--code", required=True, help="Organization code")
    p_get.set_defaults(func=cmd_get)

    args = parser.parse_args()
    args.func(args)


if __name__ == "__main__":
    main()