#!/usr/bin/env python3
"""Import transformed CSVs into local PostgreSQL."""
import argparse
import csv
import io
import json
import sys
from pathlib import Path

try:
    import psycopg2
    from psycopg2.extras import Json
except ImportError:
    import subprocess
    subprocess.check_call([sys.executable, "-m", "pip", "install", "psycopg2-binary", "-q"])
    import psycopg2
    from psycopg2.extras import Json

DSN = "postgresql://smart_edu:smart_edu_local@127.0.0.1:5432/smart_edu_hub"
OUT = Path(r"C:\Users\HP\Downloads\migration_output")

TABLES = [
    ("users", OUT / "users_transformed.csv"),
    ("content_uploads", OUT / "content_uploads_transformed.csv"),
    ("worksheets", OUT / "worksheets_transformed.csv"),
]

INT_COLS = {"id", "user_id", "student_count", "worksheets_generated", "length", "rating", "page_count"}
JSON_COLS = {"content"}
NOT_NULL_DEFAULTS = {
    "mobile_number": "",
    "password": "",
    "plan": "free",
    "plan_type": "worksheet",
    "plan_name": "Free",
    "name": "Unknown",
    "email": "unknown@local",
    "worksheets_generated": 0,
    "length": 10,
    "difficulty": "medium",
    "color_mode": "bw",
    "worksheet_type": "worksheet",
    "chapter": "",
    "topic": "",
    "extracted_text": "",
    "source_description": "",
    "page_count": 1,
    "class_name": "Unknown",
    "board": "CBSE",
    "subject": "General",
    "content": "{}",
}


def read_csv(path: Path) -> tuple[list[str], list[dict[str, str]]]:
    raw = path.read_bytes()
    for enc in ("utf-8-sig", "utf-8", "cp1252", "latin-1"):
        try:
            text = raw.decode(enc)
            break
        except UnicodeDecodeError:
            continue
    else:
        text = raw.decode("utf-8", errors="replace")
    reader = csv.DictReader(io.StringIO(text))
    headers = list(reader.fieldnames or [])
    return headers, list(reader)


def coerce(col: str, val: str):
    if val is None or str(val).strip() == "":
        if col in NOT_NULL_DEFAULTS:
            return NOT_NULL_DEFAULTS[col]
        return None
    if col in INT_COLS:
        return int(float(val))
    if col in JSON_COLS:
        try:
            return Json(json.loads(val))
        except json.JSONDecodeError:
            return Json({})
    return val


def import_table(conn, table: str, path: Path, replace: bool = False) -> int:
    headers, rows = read_csv(path)
    with conn.cursor() as cur:
        cur.execute(
            """SELECT column_name FROM information_schema.columns
               WHERE table_schema='public' AND table_name=%s ORDER BY ordinal_position""",
            (table,),
        )
        db_cols = [r[0] for r in cur.fetchall()]
        use_cols = [c for c in db_cols if c in headers]
        if not use_cols:
            raise RuntimeError(f"No overlapping columns for {table}")

        cur.execute(f"SELECT COUNT(*) FROM {table}")
        existing = cur.fetchone()[0]
        if existing > 0 and not replace:
            print(f"  SKIP {table}: already has {existing} rows (use --replace to reload)")
            return 0
        if existing > 0 and replace:
            print(f"  TRUNCATE {table} ({existing} existing rows)")
            cur.execute(f"TRUNCATE TABLE {table} RESTART IDENTITY CASCADE")

        placeholders = ", ".join(["%s"] * len(use_cols))
        col_list = ", ".join(use_cols)
        sql = f"INSERT INTO {table} ({col_list}) VALUES ({placeholders})"

        inserted = 0
        for i, row in enumerate(rows, start=2):
            try:
                values = [coerce(c, row.get(c, "")) for c in use_cols]
                cur.execute(sql, values)
                inserted += 1
            except Exception as e:
                raise RuntimeError(f"{table} CSV row {i}: {e}") from e

        cur.execute(
            "SELECT setval(pg_get_serial_sequence(%s, %s), COALESCE((SELECT MAX(id) FROM {}), 1))".format(table),
            (table, "id"),
        )
    return inserted


def main():
    parser = argparse.ArgumentParser(description="Import migration CSVs into PostgreSQL")
    parser.add_argument(
        "--tables",
        default="users,content_uploads,worksheets",
        help="Comma-separated tables to import",
    )
    parser.add_argument(
        "--replace",
        action="store_true",
        help="Truncate target tables before import",
    )
    args = parser.parse_args()
    wanted = {t.strip() for t in args.tables.split(",") if t.strip()}

    conn = psycopg2.connect(DSN)
    try:
        selected = [(t, p) for t, p in TABLES if t in wanted]
        if not selected:
            print("No matching tables.", file=sys.stderr)
            sys.exit(1)

        # Import worksheets before content_uploads only matters for FK - no cross FK
        for table, path in selected:
            if not path.exists():
                print(f"Missing {path}")
                continue
            print(f"Importing {table} from {path.name}...")
            n = import_table(conn, table, path, replace=args.replace)
            print(f"  -> {n} rows inserted")

        conn.commit()
        with conn.cursor() as cur:
            for table, _ in TABLES:
                if table in wanted:
                    cur.execute(f"SELECT COUNT(*) FROM {table}")
                    print(f"{table}: {cur.fetchone()[0]} total rows")
    except Exception as e:
        conn.rollback()
        print(f"FAILED: {e}", file=sys.stderr)
        sys.exit(1)
    finally:
        conn.close()


if __name__ == "__main__":
    main()
