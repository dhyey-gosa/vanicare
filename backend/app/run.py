"""Locutus SLP launcher: python run.py [--host 127.0.0.1] [--port 8000] [--reload]

Initialises the database (seeds the demo world on first run) and starts uvicorn.
"""
import argparse
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from app import db  # noqa: E402
from app import seed  # noqa: E402


def main() -> None:
    parser = argparse.ArgumentParser(description="Locutus SLP backend launcher")
    parser.add_argument("--host", default="127.0.0.1")
    parser.add_argument("--port", type=int, default=8000)
    parser.add_argument("--reload", action="store_true")
    parser.add_argument("--reset", action="store_true", help="Drop and re-seed the database")
    args = parser.parse_args()

    if args.reset:
        db_path = Path(db.DB_PATH)
        if db_path.exists():
            db_path.unlink()
            print(f"[locutus-slp] Removed {db_path}")

    db.init_db()
    if seed.seed_if_empty():
        print("[locutus-slp] Seeded demo world")
    print(f"[locutus-slp] DB: {db.DB_PATH}")

    import uvicorn

    uvicorn.run("app.main:app", host=args.host, port=args.port, reload=args.reload)


if __name__ == "__main__":
    main()
