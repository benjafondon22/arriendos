"""Local checks for the exact production SQL and offline packaging contract.

The Windows job additionally tests the installed Tauri app through its real IPC.
These tests alone do not claim native desktop readiness.
"""
import json
from pathlib import Path
import sqlite3
import tempfile
import unittest

ROOT = Path(__file__).resolve().parents[1]
MIGRATION = (ROOT / 'src-tauri/migrations/001_apartments.sql').read_text(encoding='utf-8')


class PersistenceTests(unittest.TestCase):
    def test_legacy_database_survives_migration_and_reopen(self):
        with tempfile.TemporaryDirectory() as temp:
            path = Path(temp) / 'arriendos.db'
            original = {'id': 'legacy', 'title': 'Ñuñoa · terraza', 'rent': 500000, 'phone': '+56 9 1234 5678'}
            with sqlite3.connect(path) as db:
                db.execute('CREATE TABLE apartments (id TEXT PRIMARY KEY, data TEXT NOT NULL)')
                db.execute('INSERT INTO apartments VALUES (?, ?)', ('legacy', json.dumps(original)))
            # Adopt a database produced by the first version; then repeat startup.
            for _ in range(2):
                with sqlite3.connect(path) as db:
                    db.executescript(MIGRATION)
                    self.assertEqual(json.loads(db.execute('SELECT data FROM apartments').fetchone()[0]), original)
                    self.assertEqual(db.execute('PRAGMA integrity_check').fetchone()[0], 'ok')

    def test_new_database_updates_persist_and_delete(self):
        with tempfile.TemporaryDirectory() as temp:
            path = Path(temp) / 'arriendos.db'
            with sqlite3.connect(path) as db:
                db.executescript(MIGRATION)
                for value in ['primera', 'actualizada']:
                    db.execute('INSERT INTO apartments (id, data) VALUES ($1, $2) ON CONFLICT(id) DO UPDATE SET data = excluded.data', {'1': 'a', '2': json.dumps({'title': value})})
            with sqlite3.connect(path) as db:
                self.assertEqual(db.execute('SELECT COUNT(*) FROM apartments').fetchone()[0], 1)
                self.assertEqual(json.loads(db.execute('SELECT data FROM apartments').fetchone()[0])['title'], 'actualizada')
                db.execute('DELETE FROM apartments WHERE id = $1', {'1': 'a'})
            with sqlite3.connect(path) as db:
                self.assertEqual(db.execute('SELECT COUNT(*) FROM apartments').fetchone()[0], 0)

    def test_stable_identity_and_offline_installer(self):
        config = json.loads((ROOT / 'src-tauri/tauri.conf.json').read_text(encoding='utf-8'))
        self.assertEqual(config['identifier'], 'cl.personal.arriendos')
        self.assertEqual(config['bundle']['targets'], ['nsis'])
        self.assertEqual(config['bundle']['windows']['webviewInstallMode']['type'], 'offlineInstaller')
        self.assertEqual(config['bundle']['windows']['nsis']['installMode'], 'currentUser')
        self.assertIn('sqlite:arriendos.db', (ROOT / 'src/storage.ts').read_text(encoding='utf-8'))
        self.assertIn('sqlite:arriendos.db', (ROOT / 'src-tauri/src/lib.rs').read_text(encoding='utf-8'))


if __name__ == '__main__':
    unittest.main()
