#!/usr/bin/env python3
"""
Migrate users.csv, content_uploads.csv, worksheets.csv into PostgreSQL-compatible CSVs.
Schema source of truth: shared/schema.ts (Drizzle pgTable definitions).
"""
from __future__ import annotations

import csv
import io
import json
import re
import sys
from datetime import datetime
from pathlib import Path
from typing import Any, Callable

INPUT_DIR = Path(r"C:\Users\HP\Downloads")
OUTPUT_DIR = Path(r"C:\Users\HP\Downloads\migration_output")

# PostgreSQL column order (matches shared/schema.ts)
TABLE_SCHEMAS: dict[str, list[tuple[str, str, Callable[[Any], Any]]]] = {
    "users": [
        ("id", "integer", lambda v: parse_int(v, required=True)),
        ("email", "text", lambda v: require_str(v, "email@unknown.local")),
        ("password", "text", lambda v: str_or_default(v, "")),
        ("name", "text", lambda v: require_str(v, "Unknown")),
        ("mobile_number", "text", lambda v: str_or_default(v, "")),
        ("user_category", "text", lambda v: null_or_str(v)),
        ("google_id", "text", lambda v: null_or_str(v)),
        ("facebook_id", "text", lambda v: null_or_str(v)),
        ("plan", "text", lambda v: str_or_default(v, "free")),
        ("plan_type", "text", lambda v: str_or_default(v, "worksheet")),
        ("plan_name", "text", lambda v: str_or_default(v, "Free")),
        ("billing_cycle", "text", lambda v: null_or_str(v)),
        ("student_count", "integer", lambda v: parse_int(v, required=False)),
        ("plan_expires_at", "timestamp", lambda v: parse_timestamp(v)),
        ("worksheets_generated", "integer", lambda v: parse_int(v, required=False, default=0)),
        ("stripe_customer_id", "text", lambda v: null_or_str(v)),
        ("stripe_subscription_id", "text", lambda v: null_or_str(v)),
        ("razorpay_customer_id", "text", lambda v: null_or_str(v)),
        ("razorpay_subscription_id", "text", lambda v: null_or_str(v)),
        ("last_login_at", "timestamp", lambda v: parse_timestamp(v)),
        ("last_logout_at", "timestamp", lambda v: parse_timestamp(v)),
        ("created_at", "timestamp", lambda v: parse_timestamp(v)),
    ],
    "worksheets": [
        ("id", "integer", lambda v: parse_int(v, required=True)),
        ("serial_number", "text", lambda v: null_or_str(v)),
        ("user_id", "integer", lambda v: parse_int(v, required=False)),
        ("class_name", "text", lambda v: require_str(v, "Unknown")),
        ("board", "text", lambda v: require_str(v, "CBSE")),
        ("subject", "text", lambda v: require_str(v, "General")),
        ("chapter", "text", lambda v: null_or_str(v)),
        ("topic", "text", lambda v: require_str(v, "General")),
        ("difficulty", "text", lambda v: str_or_default(v, "medium")),
        ("length", "integer", lambda v: parse_int(v, required=False, default=10)),
        ("color_mode", "text", lambda v: str_or_default(v, "bw")),
        ("worksheet_type", "text", lambda v: str_or_default(v, "worksheet")),
        ("content", "json", lambda v: parse_json(v)),
        ("rating", "integer", lambda v: parse_int(v, required=False)),
        ("created_at", "timestamp", lambda v: parse_timestamp(v)),
    ],
    "content_uploads": [
        ("id", "integer", lambda v: parse_int(v, required=True)),
        ("user_id", "integer", lambda v: parse_int(v, required=True)),
        ("board", "text", lambda v: require_str(v, "CBSE")),
        ("class_name", "text", lambda v: require_str(v, "Unknown")),
        ("subject", "text", lambda v: require_str(v, "General")),
        ("chapter", "text", lambda v: str_or_default(v, "")),
        ("topic", "text", lambda v: str_or_default(v, "")),
        ("extracted_text", "text", lambda v: require_str(v, "")),
        ("source_description", "text", lambda v: str_or_default(v, "")),
        ("page_count", "integer", lambda v: parse_int(v, required=False, default=1)),
        ("created_at", "timestamp", lambda v: parse_timestamp(v)),
    ],
}

CSV_FILES = {
    "users": INPUT_DIR / "users.csv",
    "content_uploads": INPUT_DIR / "content_uploads.csv",
    "worksheets": INPUT_DIR / "worksheets.csv",
}

# Explicit header aliases (CSV header -> PostgreSQL column)
HEADER_ALIASES: dict[str, dict[str, str]] = {
    "users": {
        "mobile number": "mobile_number",
        "mobile": "mobile_number",
        "user id": "id",
        "first name": "name",
        "email address": "email",
    },
    "worksheets": {},
    "content_uploads": {},
}


def trim(v: Any) -> str:
    if v is None:
        return ""
    return str(v).strip()


def strip_wrapped_quotes(s: str) -> str:
    s = trim(s)
    while len(s) >= 2 and (
        (s.startswith('"""') and s.endswith('"""'))
        or (s.startswith('"') and s.endswith('"'))
    ):
        if s.startswith('"""') and s.endswith('"""'):
            s = s[3:-3].strip()
        elif s.startswith('"') and s.endswith('"'):
            s = s[1:-1].strip()
        else:
            break
    return s


def null_or_str(v: Any) -> str | None:
    s = strip_wrapped_quotes(trim(v))
    return None if s == "" else s


def str_or_default(v: Any, default: str) -> str:
    s = strip_wrapped_quotes(trim(v))
    return default if s == "" else s


def require_str(v: Any, default: str) -> str:
    s = strip_wrapped_quotes(trim(v))
    return default if s == "" else s


def parse_int(v: Any, required: bool = False, default: int | None = None) -> int | None:
    s = strip_wrapped_quotes(trim(v))
    if s == "":
        if required:
            raise ValueError(f"Required integer missing: {v!r}")
        return default
    try:
        return int(float(s))
    except ValueError as e:
        raise ValueError(f"Invalid integer: {v!r}") from e


def parse_timestamp(v: Any) -> str | None:
    s = strip_wrapped_quotes(trim(v))
    if s == "":
        return None
    # Normalize ISO timestamps
    s = s.replace("Z", "+00:00") if s.endswith("Z") and "+" not in s else s
    for fmt in (
        "%Y-%m-%dT%H:%M:%S.%f%z",
        "%Y-%m-%dT%H:%M:%S%z",
        "%Y-%m-%d %H:%M:%S.%f",
        "%Y-%m-%d %H:%M:%S",
        "%Y-%m-%d",
    ):
        try:
            dt = datetime.strptime(s, fmt)
            return dt.strftime("%Y-%m-%d %H:%M:%S.%f")[:-3] if dt.microsecond else dt.strftime("%Y-%m-%d %H:%M:%S")
        except ValueError:
            continue
    # Fallback: return cleaned string if it looks timestamp-like
    if re.match(r"\d{4}-\d{2}-\d{2}", s):
        return s[:26]
    return s


def parse_json(v: Any) -> str:
    s = trim(v)
    if s == "":
        return "{}"
    # Already JSON object string from CSV
    try:
        obj = json.loads(s)
        return json.dumps(obj, ensure_ascii=False, separators=(",", ":"))
    except json.JSONDecodeError:
        # Attempt repair: doubled quotes from CSV export
        repaired = s.replace('""', '"')
        try:
            obj = json.loads(repaired)
            return json.dumps(obj, ensure_ascii=False, separators=(",", ":"))
        except json.JSONDecodeError as e:
            raise ValueError(f"Invalid JSON in content column: {e}") from e


def normalize_header(h: str) -> str:
    return trim(h).lower().replace(" ", "_")


def map_headers(csv_headers: list[str], table: str) -> dict[str, str]:
    """Map CSV header -> PG column name."""
    pg_cols = {c[0] for c in TABLE_SCHEMAS[table]}
    aliases = HEADER_ALIASES.get(table, {})
    mapping: dict[str, str] = {}
    for raw in csv_headers:
        key = normalize_header(raw)
        key = aliases.get(key, key)
        if key in pg_cols:
            mapping[raw] = key
    return mapping


def read_csv_rows(path: Path) -> tuple[list[str], list[dict[str, str]]]:
    raw = path.read_bytes()
    for enc in ("utf-8-sig", "utf-8", "cp1252", "latin-1"):
        try:
            text = raw.decode(enc)
            break
        except UnicodeDecodeError:
            continue
    else:
        text = raw.decode("utf-8", errors="replace")
    f = io.StringIO(text)
    reader = csv.DictReader(f)
    if not reader.fieldnames:
        raise ValueError(f"No headers in {path}")
    headers = list(reader.fieldnames)
    rows = [{k: (row.get(k) or "") for k in headers} for row in reader]
    return headers, rows


def pg_value_for_copy(val: Any) -> str:
    """Format value for PostgreSQL COPY CSV (NULL = empty field)."""
    if val is None:
        return ""
    return str(val)


def transform_table(table: str) -> dict[str, Any]:
    path = CSV_FILES[table]
    schema = TABLE_SCHEMAS[table]
    pg_columns = [c[0] for c in schema]
    converters = {c[0]: c[2] for c in schema}

    csv_headers, rows = read_csv_rows(path)
    header_map = map_headers(csv_headers, table)

    matched = sorted(set(header_map.values()))
    ignored = [h for h in csv_headers if h not in header_map]
    missing = [c for c in pg_columns if c not in matched]

    transformed: list[dict[str, Any]] = []
    errors: list[str] = []

    for i, row in enumerate(rows, start=2):
        out: dict[str, Any] = {}
        try:
            for pg_col in pg_columns:
                raw_val = ""
                for csv_h, mapped_col in header_map.items():
                    if mapped_col == pg_col:
                        raw_val = row.get(csv_h, "")
                        break
                out[pg_col] = converters[pg_col](raw_val)
            transformed.append(out)
        except Exception as e:
            errors.append(f"{table} row {i}: {e}")

    if errors:
        print(f"WARNING: {len(errors)} row errors in {table}", file=sys.stderr)
        for err in errors[:10]:
            print(f"  {err}", file=sys.stderr)
        if len(errors) > 10:
            print(f"  ... and {len(errors) - 10} more", file=sys.stderr)

    out_path = OUTPUT_DIR / f"{table}_transformed.csv"
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    with out_path.open("w", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(
            f,
            fieldnames=pg_columns,
            quoting=csv.QUOTE_MINIMAL,
            lineterminator="\n",
        )
        writer.writeheader()
        for row in transformed:
            writer.writerow({k: pg_value_for_copy(row[k]) for k in pg_columns})

    return {
        "table": table,
        "source": str(path),
        "output": str(out_path),
        "row_count": len(transformed),
        "csv_headers": csv_headers,
        "header_map": header_map,
        "pg_columns": pg_columns,
        "matched": matched,
        "ignored": ignored,
        "missing": missing,
        "errors": errors,
    }


def sql_escape(val: Any) -> str:
    if val is None:
        return "NULL"
    if isinstance(val, (int, float)) and not isinstance(val, bool):
        return str(int(val)) if isinstance(val, float) and val == int(val) else str(val)
    s = str(val).replace("'", "''")
    return f"'{s}'"


def json_sql(val: str) -> str:
    return f"'{val.replace(chr(39), chr(39)+chr(39))}'::json"


def generate_copy_sql(table: str, pg_columns: list[str], csv_path: Path) -> str:
    cols = ",\n    ".join(pg_columns)
    posix = csv_path.as_posix()
    return f"""COPY {table}(
    {cols}
)
FROM '{posix}'
DELIMITER ','
CSV HEADER;
"""


def generate_insert_sql(table: str, pg_columns: list[str], rows: list[dict[str, Any]], batch_size: int = 50) -> str:
    lines = [f"-- INSERT fallback for {table} ({len(rows)} rows)", ""]
    json_cols = {"content"}
    ts_cols = {
        "plan_expires_at", "last_login_at", "last_logout_at", "created_at",
    }

    for start in range(0, len(rows), batch_size):
        chunk = rows[start : start + batch_size]
        col_list = ", ".join(pg_columns)
        lines.append(f"INSERT INTO {table} ({col_list}) VALUES")
        value_rows = []
        for row in chunk:
            vals = []
            for col in pg_columns:
                v = row[col]
                if v is None:
                    vals.append("NULL")
                elif col in json_cols:
                    vals.append(json_sql(v))
                elif col in ts_cols and v is not None:
                    vals.append(f"{sql_escape(v)}::timestamp")
                elif isinstance(v, int):
                    vals.append(str(v))
                else:
                    vals.append(sql_escape(v))
            value_rows.append(f"  ({', '.join(vals)})")
        lines.append(",\n".join(value_rows) + ";\n")
    return "\n".join(lines)


def write_report(results: list[dict[str, Any]]) -> None:
    report_path = OUTPUT_DIR / "MIGRATION_REPORT.md"
    lines = [
        "# CSV → PostgreSQL Migration Report",
        "",
        "Schema source: `Smart-Edu-Hub/shared/schema.ts`",
        "",
    ]

    for r in results:
        table = r["table"]
        lines += [
            f"## {table}",
            "",
            f"- **Source:** `{r['source']}`",
            f"- **Transformed:** `{r['output']}`",
            f"- **Rows:** {r['row_count']}",
            f"- **Row errors:** {len(r['errors'])}",
            "",
            "### Header mapping",
            "",
            "| CSV Header | PostgreSQL Column |",
            "|------------|-------------------|",
        ]
        for csv_h, pg_col in sorted(r["header_map"].items(), key=lambda x: x[1]):
            lines.append(f"| `{csv_h}` | `{pg_col}` |")
        for pg_col in r["missing"]:
            lines.append(f"| *(missing in CSV)* | `{pg_col}` → NULL/default |")

        lines += [
            "",
            "### Column summary",
            "",
            f"- **Matched:** {', '.join(f'`{c}`' for c in r['matched']) or 'none'}",
            f"- **Missing in CSV (use NULL/default):** {', '.join(f'`{c}`' for c in r['missing']) or 'none'}",
            f"- **Ignored (extra CSV columns):** {', '.join(f'`{c}`' for c in r['ignored']) or 'none'}",
            "",
            "### PostgreSQL COPY",
            "",
            "```sql",
            generate_copy_sql(table, r["pg_columns"], Path(r["output"])),
            "```",
            "",
        ]

    report_path.write_text("\n".join(lines), encoding="utf-8")


def main() -> None:
    results = []
    all_rows: dict[str, list[dict[str, Any]]] = {}

    for table in ("users", "content_uploads", "worksheets"):
        print(f"Transforming {table}...")
        r = transform_table(table)
        results.append(r)

        # Re-read transformed for INSERT generation
        _, rows = read_csv_rows(Path(r["output"]))
        schema = TABLE_SCHEMAS[table]
        converters = {c[0]: c[2] for c in schema}
        pg_columns = [c[0] for c in schema]
        parsed_rows = []
        for row in rows:
            parsed_rows.append({col: converters[col](row.get(col, "")) for col in pg_columns})
        all_rows[table] = parsed_rows

    write_report(results)

    sql_path = OUTPUT_DIR / "import.sql"
    sql_parts = [
        "-- PostgreSQL import script (generated)",
        "-- Run COPY commands first; use INSERT sections if COPY fails.",
        "",
        "BEGIN;",
        "",
    ]
    for r in results:
        sql_parts.append(f"-- ========== {r['table']} ==========")
        sql_parts.append(generate_copy_sql(r["table"], r["pg_columns"], Path(r["output"])))
        sql_parts.append("")

    sql_parts.append("-- ========== INSERT FALLBACK ==========")
    sql_parts.append("")
    for table in ("users", "content_uploads", "worksheets"):
        r = next(x for x in results if x["table"] == table)
        sql_parts.append(generate_insert_sql(table, r["pg_columns"], all_rows[table][:5]))
        sql_parts.append(f"-- ... truncated: full table has {len(all_rows[table])} rows; regenerate with batch script if needed")
        sql_parts.append("")

    sql_parts.append("COMMIT;")
    sql_path.write_text("\n".join(sql_parts), encoding="utf-8")

    # Full INSERT script (separate file, all rows)
    insert_full = OUTPUT_DIR / "import_insert_full.sql"
    full_parts = ["BEGIN;", ""]
    for table in ("users", "content_uploads", "worksheets"):
        r = next(x for x in results if x["table"] == table)
        full_parts.append(generate_insert_sql(table, r["pg_columns"], all_rows[table], batch_size=25))
    full_parts.append("COMMIT;")
    insert_full.write_text("\n".join(full_parts), encoding="utf-8")

    print(f"\nDone. Output directory: {OUTPUT_DIR}")
    for r in results:
        print(f"  {r['table']}: {r['row_count']} rows -> {r['output']}")


if __name__ == "__main__":
    main()
