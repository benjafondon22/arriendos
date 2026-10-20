"""Check the actual database written by the installed Windows application."""
import json
from pathlib import Path
import sqlite3
import sys

path, title = Path(sys.argv[1]), sys.argv[2]
assert path.is_file(), f"No existe SQLite en AppConfig: {path}"
with sqlite3.connect(f"{path.as_uri()}?mode=ro", uri=True) as connection:
    assert connection.execute("PRAGMA integrity_check").fetchone()[0] == "ok"
    records = [json.loads(row[0]) for row in connection.execute("SELECT data FROM apartments")]
    item = next(a for a in records if a["title"] == title)
    for key, value in {
        "rent": 550000, "expenses": 90000, "area": 52,
        "metro": "Chile España", "distance": 350, "floor": 7,
        "terrace": 4, "finishes": 5, "parking": 1,
        "phone": "+56 9 1234 5678", "contacted": True,
    }.items():
        assert item[key] == value, f"{key}: {item[key]!r} != {value!r}"
    assert connection.execute(
        "SELECT success FROM _sqlx_migrations WHERE version = 1"
    ).fetchone()[0] == 1, "Migración no aplicada"
print("PASS: archivo SQLite persistente, integridad, campos y migración v1")
