"""Titik masuk untuk Vercel (serverless).

Di laptop tetap jalankan:  python -m backend.app
"""
from backend.app import create_app

app = create_app()
