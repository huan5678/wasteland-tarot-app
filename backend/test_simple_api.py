#!/usr/bin/env python3
"""
Simple API test - bypasses complex service dependencies
Tests core functionality with direct card endpoints
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from supabase import create_client
import asyncio
import json

# Simple FastAPI app for testing
app = FastAPI(title="Simple Wasteland Tarot API Test")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Supabase configuration
SUPABASE_URL = "https://aelwaolzpraxmzjqdiyw.supabase.co"
SUPABASE_SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFlbHdhb2x6cHJheG16anFkaXl3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODYzNTIwNywiZXhwIjoyMDc0MjExMjA3fQ.RvRptRqlpJJjTVek5wT_uiVCTUatF9dtnBYvJ8Txra0"

supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

@app.get("/")
async def root():
    return {
        "message": "Simple Wasteland Tarot API Test",
        "status": "operational",
        "database": "supabase"
    }

@app.get("/health")
async def health():
    return {"status": "healthy", "service": "simple-wasteland-tarot-test"}

@app.get("/api/v1/cards/")
async def get_all_cards():
    """Get all cards from Supabase directly"""
    try:
        result = supabase.table('wasteland_cards').select('*').execute()
        return {"cards": result.data, "count": len(result.data)}
    except Exception as e:
        return {"error": str(e), "cards": [], "count": 0}

@app.get("/api/v1/cards/{card_id}")
async def get_card(card_id: str):
    """Get a specific card by ID"""
    try:
        result = supabase.table('wasteland_cards').select('*').eq('id', card_id).execute()
        if result.data:
            return {"card": result.data[0]}
        else:
            return {"error": "Card not found", "card": None}
    except Exception as e:
        return {"error": str(e), "card": None}

@app.get("/api/v1/cards/suit/{suit}")
async def get_cards_by_suit(suit: str):
    """Get cards by suit"""
    try:
        result = supabase.table('wasteland_cards').select('*').eq('suit', suit).execute()
        return {"cards": result.data, "count": len(result.data), "suit": suit}
    except Exception as e:
        return {"error": str(e), "cards": [], "count": 0}

@app.get("/api/v1/test/database")
async def test_database():
    """Test database connectivity"""
    try:
        result = supabase.table('wasteland_cards').select('name', 'suit').limit(3).execute()
        return {
            "status": "connected",
            "sample_cards": result.data,
            "total_cards": len(result.data)
        }
    except Exception as e:
        return {
            "status": "error",
            "error": str(e),
            "sample_cards": [],
            "total_cards": 0
        }

if __name__ == "__main__":
    import uvicorn
    print("🚀 Starting Simple Wasteland Tarot API...")
    print("📍 Available at: http://localhost:8001")
    print("📚 API docs at: http://localhost:8001/docs")
    uvicorn.run(app, host="0.0.0.0", port=8001)