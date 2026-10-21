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

# The same three real 0.1.0 records must survive the actual installer upgrade.
mode = sys.argv[3] if len(sys.argv) > 3 else 'check'
snapshot = Path('test-results/legacy-records.json')
assert len(records) == 3, f'Se esperaban tres departamentos, hay {len(records)}'
by_id = {a['id']: a for a in records}
if mode == 'capture':
    snapshot.write_text(json.dumps(by_id, ensure_ascii=False, indent=2), encoding='utf-8')
elif mode in ('unchanged', 'enhanced'):
    before = json.loads(snapshot.read_text(encoding='utf-8'))
    assert by_id.keys() == before.keys(), 'Cambiaron los IDs originales'
    if mode == 'unchanged':
        assert by_id == before, 'Abrir la nueva versión reescribió registros antiguos'
    else:
        for record_id, original in before.items():
            current = by_id[record_id]
            if original['title'] != title:
                assert current == original, 'Se alteró uno de los otros departamentos'
            else:
                assert {k: v for k, v in current.items() if k in original and k != 'notes'} == {k: v for k, v in original.items() if k != 'notes'}
                assert current['listingCode'] == 'NUN-001'
                assert current['availability'] == 'finished'
                assert current['visitScheduled'] is True
                assert current['visitAt'] == '2030-06-15T11:30'
print(f'PASS: tres departamentos originales conservados ({mode})')
