# Wasteland Tarot Database Schema Documentation

## Overview

This document describes the comprehensive Supabase database schema for the Wasteland Tarot application, a Fallout-themed tarot card reading system with advanced features including social interactions, achievements, karma tracking, and personalized interpretations.

## Architecture Summary

- **Tables**: 12 core tables with comprehensive relationships
- **Views**: 3 optimized views for common queries
- **Indexes**: 25+ performance-optimized indexes
- **Security**: Row Level Security (RLS) enabled on all tables
- **Features**: Advanced social features, achievements, karma tracking, multiple spread types

## Core Tables

### 1. wasteland_cards
**Purpose**: Stores all tarot cards with Fallout-themed interpretations

**Key Features**:
- 78 traditional tarot cards with wasteland themes
- Multiple interpretation styles (character voices, karma alignments, faction perspectives)
- Rarity system (common, uncommon, rare, legendary)
- Usage statistics and feedback tracking
- Rich metadata for immersive experience

**Important Fields**:
- `radiation_level`: 0.0-10.0 scale affecting card "randomness"
- `threat_level`: 1-10 danger scale
- `rarity_level`: Controls access (legendary requires premium)
- Multiple interpretation fields for different character voices
- Keywords arrays for semantic search

### 2. users
**Purpose**: Core user accounts with Supabase Auth integration

**Key Features**:
- Integrates with Supabase Authentication
- Wasteland-specific attributes (faction, karma, vault number)
- Subscription management (free, premium tiers)
- Daily reading limits with automatic reset
- Security features (account locking, failed login tracking)

**Important Fields**:
- `karma_score`: 0-100 scale affecting card interpretations
- `faction_alignment`: Influences reading perspectives
- `daily_readings_count`: Rate limiting mechanism
- `subscription_tier`: Controls access to premium features

### 3. user_profiles
**Purpose**: Extended user information and personalization

**Key Features**:
- SPECIAL stats system (from Fallout games)
- Achievement and badge tracking
- Social statistics (friends, reputation)
- Personalization preferences
- Accessibility settings

### 4. user_preferences
**Purpose**: Comprehensive user customization options

**Key Features**:
- UI/UX preferences (theme, colors, effects)
- Audio settings (volumes, effects)
- Privacy controls
- Notification preferences
- Accessibility options

### 5. spread_templates
**Purpose**: Defines different tarot spread layouts and rules

**Key Features**:
- Multiple divination methods (Single Card, Vault-Tec Spread, etc.)
- Flexible position configuration with JSON layout data
- Difficulty levels and faction associations
- Premium spread access control
- Usage analytics

**Built-in Spreads**:
- Single Wasteland Card: Quick guidance
- Vault-Tec Spread: Past/Present/Future
- Wasteland Survival Spread: 5-card tactical reading
- Brotherhood Council: 7-card complex analysis

### 6. interpretation_templates
**Purpose**: Character voice templates for varied interpretation styles

**Key Features**:
- Multiple character voices (Pip-Boy, Vault Dweller, etc.)
- Personality traits and speaking patterns
- Fallout-specific references and expressions
- Template weighting for variation

### 7. reading_sessions
**Purpose**: Core reading data with privacy controls

**Key Features**:
- Complete reading session tracking
- Multiple privacy levels (private, friends, public)
- Context information (mood, location, faction influence)
- User feedback and accuracy ratings
- Session duration tracking

### 8. reading_card_positions
**Purpose**: Individual card positions within readings

**Key Features**:
- Links cards to specific positions in spreads
- Reversed/upright orientation tracking
- Individual card interpretations
- Synergy notes between cards
- Temporal drawing sequence

### 9. card_synergies
**Purpose**: Defines relationships between card combinations

**Key Features**:
- Multiple synergy types (complementary, conflicting, etc.)
- Strength ratings for synergy effects
- Contextual conditions (spread types, positions)
- Faction and karma-specific synergies
- Usage statistics and user feedback

### 10. user_achievements
**Purpose**: Gamification and progress tracking

**Key Features**:
- Comprehensive achievement system
- Progress tracking with percentages
- Multiple categories (reading, social, exploration)
- Reward systems (experience, community points)
- Completion tracking and timestamps

### 11. karma_history
**Purpose**: Tracks all karma changes over time

**Key Features**:
- Complete audit trail of karma modifications
- Automatic vs manual change tracking
- Context linking to readings or actions
- Admin override capabilities
- Detailed reasoning for changes

### 12. user_friendships
**Purpose**: Social connections and friend management

**Key Features**:
- Friend request workflow (pending/accepted/blocked/declined)
- Privacy controls for reading sharing
- Notification level management
- Interaction statistics
- Mutual friend tracking

## Views

### popular_cards
Aggregates card usage statistics with user ratings for discovering trending cards.

### user_statistics
Comprehensive user metrics combining data from multiple tables for dashboard displays.

### friend_recommendations
Suggests potential friends based on compatibility scores calculated from shared interests.

## Security Model

### Row Level Security (RLS)
All tables have RLS enabled with carefully designed policies:

- **Public Data**: Cards and templates readable by all users
- **User Data**: Users can only access their own data
- **Friend Data**: Conditional access based on friendship status and privacy settings
- **Premium Content**: Restricted based on subscription status
- **Admin Functions**: Separate policies for administrative access

### Rate Limiting
- Daily reading limits (10 free, 50 premium)
- Automatic daily counter reset
- Premium tier validation
- Function-based limit checking

### Audit Trail
- Security audit log for all sensitive operations
- Failed login attempt tracking
- Account locking mechanisms
- Change tracking for critical data

## Performance Optimizations

### Indexing Strategy
- **Composite indexes** for common query patterns
- **GIN indexes** for array and JSON columns
- **Partial indexes** for filtered queries
- **Concurrent index creation** for zero-downtime deployment

### Key Indexes
- `idx_reading_sessions_user_state`: User readings by status
- `idx_wasteland_cards_keywords_gin`: Full-text card search
- `idx_user_friendships_requester`: Friend relationship lookups
- `idx_card_synergies_primary`: Card combination queries

## Migration Strategy

### Phase 1: Preparation
1. Create backup tables
2. Validate current data integrity
3. Check dependency constraints

### Phase 2: Schema Deployment
1. Apply enhanced schema
2. Create new tables and relationships
3. Set up indexes and triggers

### Phase 3: Data Migration
1. Migrate existing readings to new session format
2. Convert card positions to normalized structure
3. Initialize karma history for existing users
4. Create initial achievements

### Phase 4: Validation
1. Verify data integrity
2. Test query performance
3. Validate security policies
4. Check trigger functionality

### Phase 5: Cleanup
1. Remove backup tables (after validation)
2. Update application code
3. Monitor performance metrics

## API Integration

### Supabase Client Configuration
```typescript
import { createClient } from '@supabase/supabase-js'
import type { Database } from './types/database'

const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)
```

### Common Query Patterns
```typescript
// Get user's recent readings
const { data: readings } = await supabase
  .from('reading_sessions')
  .select(`
    *,
    reading_card_positions (
      *,
      wasteland_cards (*)
    )
  `)
  .eq('user_id', userId)
  .eq('session_state', 'completed')
  .order('completed_at', { ascending: false })
  .limit(10)

// Get popular cards
const { data: cards } = await supabase
  .from('popular_cards')
  .select('*')
  .limit(20)

// Check friendship status
const { data: friendship } = await supabase
  .from('user_friendships')
  .select('status')
  .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`)
  .or(`requester_id.eq.${friendId},addressee_id.eq.${friendId}`)
  .single()
```

## Backup and Recovery

### Automated Backups
- Supabase provides automatic daily backups
- Point-in-time recovery available
- Custom backup scripts for critical data

### Manual Backup Procedures
```sql
-- Create comprehensive backup
pg_dump --host=db.xxx.supabase.co \
        --port=5432 \
        --username=postgres \
        --dbname=postgres \
        --schema=public \
        --data-only \
        --file=wasteland_tarot_backup.sql
```

## Monitoring and Maintenance

### Performance Monitoring
- Query performance tracking via Supabase dashboard
- Slow query identification and optimization
- Index usage analysis
- Connection pool monitoring

### Data Integrity Checks
```sql
-- Check referential integrity
SELECT 'user_profiles' as table_name, COUNT(*) as orphaned_records
FROM user_profiles up
LEFT JOIN users u ON up.user_id = u.id
WHERE u.id IS NULL

UNION ALL

SELECT 'reading_card_positions', COUNT(*)
FROM reading_card_positions rcp
LEFT JOIN reading_sessions rs ON rcp.session_id = rs.id
WHERE rs.id IS NULL;
```

### Maintenance Tasks
- Weekly statistics updates
- Monthly achievement calculations
- Quarterly data archival for old sessions
- Annual performance review and optimization

## Future Enhancements

### Planned Features
1. **Real-time Features**: Using Supabase Realtime for live friend activity
2. **Advanced Analytics**: User behavior tracking and recommendations
3. **Content Management**: Admin dashboard for card and template management
4. **API Extensions**: GraphQL layer for complex queries
5. **Data Warehousing**: Analytics database for business intelligence

### Scalability Considerations
- Horizontal scaling via read replicas
- Data partitioning for large tables
- Caching layer for frequently accessed data
- CDN integration for static assets

## Conclusion

This schema provides a robust foundation for the Wasteland Tarot application, supporting all core features while maintaining performance, security, and scalability. The modular design allows for future enhancements while the comprehensive documentation ensures maintainability.

For implementation questions or schema modifications, refer to the migration scripts and TypeScript definitions provided alongside this documentation.