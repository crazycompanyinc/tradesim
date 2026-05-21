#!/usr/bin/env python3
"""
ROTA TRON Integration for TradeSim
Auto-generado por METATRON v1.0
"""
import subprocess
import sys
from pathlib import Path

ROTATRON_NOTIFY = Path("/root/.hermes/skills/rotatron/scripts/rotatron_notify.py")

def notify_complete(output: str, event_type: str = "task_complete"):
    """Notificar a ROTATRON que TradeSim terminó."""
    if not ROTATRON_NOTIFY.exists():
        return
    try:
        subprocess.run([
            sys.executable, str(ROTATRON_NOTIFY), "notify",
            "--agent", "tradesim", "--project", "tradesim",
            "--type", event_type, "--output", output[:2000]
        ], capture_output=True, timeout=15)
    except Exception:
        pass

def get_next_prompt() -> str:
    """Obtener siguiente prompt de ROTATRON."""
    if not ROTATRON_NOTIFY.exists():
        return ""
    try:
        result = subprocess.run([
            sys.executable, str(ROTATRON_NOTIFY), "prompt", "--project", "tradesim"
        ], capture_output=True, text=True, timeout=15)
        return result.stdout.strip()
    except Exception:
        return ""
