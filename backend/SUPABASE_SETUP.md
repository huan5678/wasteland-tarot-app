# Supabase Database Setup for Wasteland Tarot

This document explains how to configure and use Supabase as the primary database for the Wasteland Tarot backend.

## 🔧 Configuration

### Environment Variables (.env)

The backend is now configured to use Supabase PostgreSQL by default:

```bash
# Supabase Configuration
SUPABASE_URL=https://aelwaolzpraxmzjqdiyw.supabase.co
SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Database Configuration (Supabase PostgreSQL)
DATABASE_URL=postgresql+asyncpg://postgres.aelwaolzpraxmzjqdiyw:wasteland_vault_secure_password_2024@aws-0-us-west-1.pooler.supabase.com:6543/postgres
DB_HOST=aws-0-us-west-1.pooler.supabase.com
DB_PORT=6543
DB_NAME=postgres
DB_USER=postgres.aelwaolzpraxmzjqdiyw
DB_PASSWORD=wasteland_vault_secure_password_2024
```

## 🗄️ Database Scripts

### 1. Database Initialization
```bash
python init_supabase_db.py
```
Creates all required tables in Supabase.

### 2. Seed Sample Data
```bash
python seed_supabase_cards.py
```
Populates the database with comprehensive Wasteland Tarot card data including all required fields.

### 3. Startup Verification
```bash
python startup.py
```
Runs comprehensive checks to ensure the database is properly configured and contains required data.

## 📋 Database Schema

The `wasteland_cards` table includes these required fields:

### Basic Information
- `id` (UUID, primary key)
- `name` (string, required)
- `suit` (string, required)
- `number` (integer, nullable for Major Arcana)

### Fallout-Specific Attributes
- `radiation_level` (float, 0.0-1.0)
- `threat_level` (integer, 1-10)
- `vault_number` (integer, nullable)

### Card Content (Required)
- `upright_meaning` (text, **NOT NULL**)
- `reversed_meaning` (text, **NOT NULL**)

### Interpretations
- Karma-based: `good_karma_interpretation`, `neutral_karma_interpretation`, `evil_karma_interpretation`
- Character voices: `pip_boy_analysis`, `vault_dweller_perspective`, etc.
- Faction significance: `brotherhood_significance`, `ncr_significance`, etc.

### Multimedia Elements
- `image_url`, `audio_cue_url`, `background_image_url`
- `geiger_sound_intensity`
- `pip_boy_scan_data` (JSON)

### Game Mechanics
- SPECIAL stat effects: `affects_luck_stat`, `affects_charisma_stat`, `affects_intelligence_stat`
- `special_ability` (text description)
- Usage tracking: `draw_frequency`, `total_appearances`, `last_drawn_at`

## 🚀 Quick Start

1. **Verify Configuration**:
   ```bash
   python startup.py
   ```

2. **Initialize Database** (if needed):
   ```bash
   python init_supabase_db.py
   ```

3. **Seed Data** (if database is empty):
   ```bash
   python seed_supabase_cards.py
   ```

4. **Start the API**:
   ```bash
   uvicorn app.main:app --reload
   ```

## ⚠️ Important Notes

- **SQLite scripts are deprecated**: Use `seed_supabase_cards.py` instead of `seed_cards.py`
- **All database operations now target Supabase**: No more local SQLite database
- **Required fields**: Ensure `upright_meaning` and `reversed_meaning` are never null
- **Connection pooling**: Configured for optimal performance with Supabase

## 🔍 Troubleshooting

### Connection Issues
1. Verify the `DATABASE_URL` is correct
2. Check that the `DB_PASSWORD` matches your Supabase project settings
3. Ensure Supabase project is active and accessible

### Missing Data
1. Run `python startup.py` to check database status
2. Use `python seed_supabase_cards.py` to populate with sample data
3. Verify tables exist with `python init_supabase_db.py`

### Performance Issues
1. Check connection pool settings in `app/db/database.py`
2. Monitor Supabase dashboard for query performance
3. Adjust `pool_size` and `max_overflow` in configuration if needed

## 📊 Monitoring

The startup script provides useful diagnostics:
- Database connection status
- Table existence verification
- Card count in database
- Environment configuration summary

Regular monitoring helps ensure optimal performance and data integrity.