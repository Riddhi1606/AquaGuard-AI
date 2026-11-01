"""
AquaGuard AI — Standalone Data Seeding Script
"""

import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from backend.app.database.init_db import init_db

if __name__ == "__main__":
    print("Running database reset and seed...")
    init_db()
    print("Seed complete.")
