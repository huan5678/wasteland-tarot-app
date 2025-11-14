# Row-Level Security (RLS) Policies

## Overview

This document defines Row-Level Security policies for Supabase PostgreSQL database to implement NFR-3.3: Ensure users can only access their own data.

## Requirement

**NFR-3.3**: When users query reading records, the system shall ensure each user only has access to their own data through row-level security.

## Implementation

### 1. Enable RLS on Tables

Run the following SQL in Supabase SQL Editor:

```sql
-- Enable RLS on completed_readings table
ALTER TABLE completed_readings ENABLE ROW LEVEL SECURITY;

-- Enable RLS on reading_tags table
ALTER TABLE reading_tags ENABLE ROW LEVEL SECURITY;

-- Enable RLS on reading_categories table
ALTER TABLE reading_categories ENABLE ROW LEVEL SECURITY;

-- Enable RLS on journal_entries table (if exists)
ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;

-- Enable RLS on user_achievements table (if exists)
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
```

### 2. Create RLS Policies

#### Policy: Users Can Only Read Their Own Readings

```sql
CREATE POLICY "Users can only read their own readings"
ON completed_readings
FOR SELECT
USING (auth.uid() = user_id);
```

#### Policy: Users Can Only Insert Their Own Readings

```sql
CREATE POLICY "Users can only insert their own readings"
ON completed_readings
FOR INSERT
WITH CHECK (auth.uid() = user_id);
```

#### Policy: Users Can Only Update Their Own Readings

```sql
CREATE POLICY "Users can only update their own readings"
ON completed_readings
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
```

#### Policy: Users Can Only Delete Their Own Readings

```sql
CREATE POLICY "Users can only delete their own readings"
ON completed_readings
FOR DELETE
USING (auth.uid() = user_id);
```

#### Policy: Users Can Only Access Their Own Tags

```sql
CREATE POLICY "Users can only access their own tags"
ON reading_tags
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM completed_readings
    WHERE completed_readings.id = reading_tags.reading_id
    AND completed_readings.user_id = auth.uid()
  )
);
```

#### Policy: Users Can Only Access Their Own Categories

```sql
CREATE POLICY "Users can only access their own categories"
ON reading_categories
FOR ALL
USING (auth.uid() = user_id);
```

### 3. Service Role Bypass

For administrative operations, use the Supabase service role key which bypasses RLS:

```python
from app.config import settings
from supabase import create_client

# Service role client (bypasses RLS)
admin_client = create_client(
    settings.supabase_url,
    settings.supabase_service_role_key
)

# Regular client (respects RLS)
user_client = create_client(
    settings.supabase_url,
    settings.supabase_key
)
```

### 4. Testing RLS Policies

To test RLS policies in Supabase SQL Editor:

```sql
-- Test as specific user
SET LOCAL "request.jwt.claims" = '{"sub": "user-uuid-here"}';

-- Try to access data
SELECT * FROM completed_readings;

-- Should only return readings for user-uuid-here
```

### 5. Public Sharing Exception

For shared readings, create a separate view without RLS:

```sql
-- Create view for public shared readings
CREATE OR REPLACE VIEW public_shared_readings AS
SELECT
  id,
  question,
  interpretation,
  spread_type,
  cards_drawn,
  created_at,
  -- Exclude PII fields
  NULL as user_id,
  NULL as user_email
FROM completed_readings
WHERE is_public_share = true;

-- No RLS on this view (it's public by design)
```

## Verification

### Verify RLS is Enabled

```sql
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('completed_readings', 'reading_tags', 'reading_categories');
```

Expected output:
```
tablename           | rowsecurity
--------------------|------------
completed_readings  | true
reading_tags        | true
reading_categories  | true
```

### Verify Policies Exist

```sql
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN ('completed_readings', 'reading_tags', 'reading_categories');
```

## Security Considerations

1. **Always use RLS**: Never disable RLS in production
2. **Service Role Security**: Keep service role key secret, only use server-side
3. **User Context**: Always pass user JWT token to Supabase queries
4. **Audit Logs**: Monitor RLS policy violations in Supabase logs

## Migration Checklist

- [ ] Enable RLS on all user-data tables
- [ ] Create SELECT policies
- [ ] Create INSERT policies
- [ ] Create UPDATE policies
- [ ] Create DELETE policies
- [ ] Test with multiple user accounts
- [ ] Verify service role bypass works
- [ ] Document any exceptions
- [ ] Set up monitoring alerts

## Related Requirements

- NFR-3.3: Row-level security in Supabase
- NFR-3.7: PII protection in shared readings

---

**Last Updated**: 2025-11-13
**Status**: Implementation Required
**Owner**: Backend Team
