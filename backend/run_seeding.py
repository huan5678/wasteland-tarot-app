#!/usr/bin/env python3
"""
Quick script to run seeding without user input
"""

import asyncio
import sys
from pathlib import Path

# Add the backend directory to the Python path
backend_dir = Path(__file__).parent
sys.path.append(str(backend_dir))

from app.db.master_seed import run_master_seeding

if __name__ == "__main__":
    print("🎲 Running Wasteland Tarot Database Seeding...")
    asyncio.run(run_master_seeding())