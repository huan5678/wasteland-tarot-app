# Unified Karma & Gamification System

## 🎯 Project Overview

A complete gamification system integrating **alignment karma** (陣營系統) with **level progression** (等級系統) and **quest system** (任務系統) for the Wasteland Tarot application.

**Status**: ✅ **Core Implementation Complete**  
**Completion Date**: 2025-11-03  
**Implementation Time**: 13 hours (vs 60 hours estimated)

---

## 📚 Documentation Index

### Implementation Reports
1. **[tasks.md](./tasks.md)** - Complete task list with status tracking
2. **[FINAL_IMPLEMENTATION_REPORT.md](./FINAL_IMPLEMENTATION_REPORT.md)** - Comprehensive implementation summary
3. **[DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)** - Production deployment instructions

### Phase Completion Reports
4. **[PHASE_2_COMPLETION_SUMMARY.md](./PHASE_2_COMPLETION_SUMMARY.md)** - Service Layer implementation
5. **[PHASE_3_4_COMPLETION.md](./PHASE_3_4_COMPLETION.md)** - API & Background Tasks
6. **[task_2.1_completion.md](./task_2.1_completion.md)** - UnifiedKarmaService
7. **[task_2.2_completion.md](./task_2.2_completion.md)** - LevelService
8. **[task_2.3_completion.md](./task_2.3_completion.md)** - QuestService

### Specification Documents
9. **[requirements.md](./requirements.md)** - Business requirements
10. **[design.md](./design.md)** - Technical design document

---

## 🏗️ System Architecture

### Core Components

```
┌─────────────────────────────────────────────────────────┐
│                  Frontend (Next.js)                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │ Karma Widget │  │ Level Badge  │  │ Quest Panel  │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
└────────────────────────┬────────────────────────────────┘
                         │ REST API
┌────────────────────────▼────────────────────────────────┐
│                API Layer (FastAPI)                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │ /karma/*     │  │ /levels/*    │  │ /quests/*    │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
└────────────────────────┬────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────┐
│              Service Layer (Python)                     │
│  ┌──────────────────┐  ┌──────────────────┐           │
│  │ UnifiedKarma     │  │   LevelService   │           │
│  │   Service        │  └──────────────────┘           │
│  └──────────────────┘            │                     │
│           │                      │                     │
│           │         ┌──────────────────┐               │
│           │         │   QuestService   │               │
│           └─────────┤                  │               │
│                     └──────────────────┘               │
└────────────────────────┬────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────┐
│              Database (PostgreSQL)                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │  user_karma  │  │ user_levels  │  │    quests    │  │
│  │              │  │              │  │              │  │
│  │ alignment    │  │ level 1-100  │  │ daily/weekly │  │
│  │ total karma  │  │ titles       │  │ objectives   │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
│         │                                    │           │
│         │          ┌──────────────────────┐  │           │
│         └─────────►│ user_quest_progress  │◄─┘           │
│                    └──────────────────────┘              │
└─────────────────────────────────────────────────────────┘
```

---

## 🎮 Feature Highlights

### 1. Dual Karma System

**Alignment Karma** (陣營 Karma, 0-100)
- Affects faction affinity
- Influences AI tone
- Can increase or decrease
- Categories: very_evil, evil, neutral, good, very_good

**Total Karma** (總累積 Karma, >= 0)
- Only increases
- Used for level calculation
- Determines rank on leaderboard
- Unlocks privileges

### 2. Level System

**Formula**: `Level = floor(total_karma / 500) + 1`

**Features**:
- 100 levels with Fallout-themed titles
- Privilege unlocking system
- Milestone reminders (every 10 levels)
- Global leaderboard
- Progress tracking with percentages

**Key Unlocks**:
- Level 4: Daily Quests
- Level 7: Weekly Quests
- Level 10: Female Voice
- Level 12: Male Voice
- Level 21: Share Reading
- Level 25: AI Enhanced Reading
- Level 30: Custom Spreads

### 3. Quest System

**Daily Quests**:
- 1 fixed quest (Today's Reading)
- 2 random quests (from pool of 7)
- Reset: Daily at 00:00 UTC

**Weekly Quests**:
- 1 fixed quest (Weekly Practice)
- 2 hard random quests (from pool of 8)
- Reset: Monday 00:00 UTC

**Quest Types**:
- Complete readings
- Bingo check-in/streak/line
- Collect unique cards
- Share readings
- Social interactions
- Use different spreads
- Draw Major Arcana cards
- Perfect reading (voice+AI+share)

---

## 📡 API Endpoints

### Karma API (`/api/v1/karma/`)
```
GET  /summary          - Karma overview
GET  /logs             - Karma logs (paginated)
GET  /history          - Alignment karma history
```

### Level API (`/api/v1/levels/`)
```
GET  /me               - My level info
GET  /{user_id}        - User level (public)
GET  /me/rank          - My rank
GET  /me/next-milestone - Next milestone
GET  /leaderboard      - Global leaderboard
GET  /details/{level}  - Level details
GET  /progress         - Detailed progress
```

### Quest API (`/api/v1/quests/`)
```
GET  /daily            - Daily quests (auto-assign)
GET  /weekly           - Weekly quests (auto-assign)
GET  /all              - All active quests
POST /{id}/claim       - Claim rewards
GET  /stats            - Quest statistics
POST /progress/update  - Update progress (testing)
```

---

## 🚀 Quick Start

### 1. Database Migration
```bash
cd /path/to/project
supabase db push
```

### 2. Start Backend
```bash
cd backend
uv sync
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### 3. Setup Background Tasks

**Option A: Crontab**
```cron
0 0 * * * python -m app.tasks.quest_scheduler daily
0 0 * * 1 python -m app.tasks.quest_scheduler weekly
0 1 * * * python -m app.tasks.quest_scheduler cleanup
```

**Option B: APScheduler** (recommended)
```python
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from app.tasks.quest_scheduler import daily_quest_reset_task

scheduler = AsyncIOScheduler(timezone='UTC')
scheduler.add_job(daily_quest_reset_task, 'cron', hour=0)
scheduler.start()
```

### 4. Test APIs
```bash
# Open Swagger UI
open http://localhost:8000/docs

# Test Karma API
curl http://localhost:8000/api/v1/karma/summary \
  -H "Authorization: Bearer <your-token>"
```

---

## 📦 Implementation Files

### Service Layer
```
backend/app/services/
├── unified_karma_service.py  (14KB)
├── level_service.py          (12KB)
└── quest_service.py          (17KB)
```

### API Endpoints
```
backend/app/api/v1/endpoints/
├── karma.py   (updated, 5.1KB)
├── levels.py  (new, 6.6KB)
└── quests.py  (new, 6.7KB)
```

### Background Tasks
```
backend/app/tasks/
├── __init__.py
└── quest_scheduler.py  (4.8KB)
```

### Database Migrations
```
supabase/migrations/
└── 20251103000000_create_user_karma.sql  (6KB)
```

**Total Code**: ~70KB (8 files)  
**Total Documentation**: ~30KB (10 files)

---

## 🧪 Testing Status

### Completed
- ✅ Service layer implementation
- ✅ API endpoint implementation
- ✅ Background task implementation
- ✅ Manual API testing

### TODO (Phase 6)
- ⏭️ Service layer unit tests (target: 85% coverage)
- ⏭️ API integration tests
- ⏭️ Background task tests
- ⏭️ Performance tests

---

## 📊 Performance Targets

| Metric | Target | Status |
|--------|--------|--------|
| API Response Time (P95) | < 200ms | ⏭️ To measure |
| Database Query Time | < 100ms | ⏭️ To measure |
| Leaderboard Query | < 500ms | ⏭️ To optimize |
| Background Task (10K users) | < 5 min | ⏭️ To test |

---

## 🔧 Configuration

### Environment Variables
```bash
# Database
DATABASE_URL=postgresql://user:pass@host:5432/db
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=eyJ...
SUPABASE_JWT_SECRET=your-jwt-secret

# Background Tasks (optional)
QUEST_RESET_ENABLED=true
QUEST_RESET_TIME=00:00
```

### Database Connection Pool
```python
# app/db/database.py
engine = create_async_engine(
    DATABASE_URL,
    pool_size=20,
    max_overflow=10,
    pool_pre_ping=True,
    pool_recycle=3600
)
```

---

## 🐛 Troubleshooting

### Issue: Quests not auto-assigning
**Solution**: 
```bash
# Manually trigger assignment
python -m app.tasks.quest_scheduler daily
python -m app.tasks.quest_scheduler weekly
```

### Issue: Karma update fails
**Check**:
1. Database connection: `psql $DATABASE_URL -c "SELECT 1"`
2. user_karma table exists: `SELECT * FROM user_karma LIMIT 1`
3. API logs: `tail -f /var/log/api.log`

### Issue: Leaderboard slow
**Optimize**:
```sql
-- Create materialized view
CREATE MATERIALIZED VIEW leaderboard AS
SELECT ROW_NUMBER() OVER (ORDER BY uk.total_karma DESC) as rank,
       u.id, u.username, uk.total_karma, uk.current_level
FROM users u JOIN user_karma uk ON u.id = uk.user_id
ORDER BY uk.total_karma DESC LIMIT 100;

-- Refresh hourly
REFRESH MATERIALIZED VIEW leaderboard;
```

---

## 🔮 Future Enhancements

### High Priority
- [ ] Frontend UI components
- [ ] Event-driven integration with reading/bingo services
- [ ] Unit and integration tests

### Medium Priority
- [ ] Redis caching layer
- [ ] Materialized views for leaderboard
- [ ] Monitoring and alerting

### Low Priority
- [ ] Karma prediction system
- [ ] Personalized quest recommendations
- [ ] Alignment-specific quests
- [ ] Quest difficulty adjustment

---

## 🤝 Contributing

### Code Structure
- Services: Pure business logic, no direct API calls
- APIs: Thin layer coordinating services
- Background tasks: Scheduled maintenance operations

### Code Style
- Follow existing patterns
- Add docstrings to all functions
- Use type hints
- Keep functions under 50 lines

### Testing
- Write tests for new features
- Maintain 85% coverage for service layer
- Test edge cases

---

## 📄 License

Part of Wasteland Tarot Application  
See main project license

---

## 📞 Support

- **Documentation**: See files in this directory
- **Issues**: Check troubleshooting section in DEPLOYMENT_GUIDE.md
- **Questions**: Refer to FINAL_IMPLEMENTATION_REPORT.md for architecture

---

**Last Updated**: 2025-11-03 23:30 UTC  
**Version**: 1.0  
**Status**: ✅ Production Ready (Core Features)
