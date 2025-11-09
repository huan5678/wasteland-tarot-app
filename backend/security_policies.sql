-- Enhanced Security Policies for Wasteland Tarot
-- Comprehensive RLS policies with advanced security measures
-- Created: 2025-01-28

-- Function to check if user is admin
CREATE OR REPLACE FUNCTION auth.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN COALESCE(
        (SELECT is_admin FROM public.users WHERE id = auth.uid()),
        false
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user is premium
CREATE OR REPLACE FUNCTION auth.is_premium()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN COALESCE(
        (SELECT is_premium FROM public.users
         WHERE id = auth.uid()
           AND (subscription_expires_at IS NULL OR subscription_expires_at > NOW())),
        false
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if users are friends
CREATE OR REPLACE FUNCTION auth.are_friends(user1_id UUID, user2_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS(
        SELECT 1 FROM public.user_friendships
        WHERE status = 'accepted'
          AND ((requester_id = user1_id AND addressee_id = user2_id)
               OR (requester_id = user2_id AND addressee_id = user1_id))
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check daily reading limits
CREATE OR REPLACE FUNCTION auth.can_create_reading()
RETURNS BOOLEAN AS $$
DECLARE
    user_record RECORD;
    max_readings INTEGER := 10; -- Free tier limit
BEGIN
    SELECT * INTO user_record
    FROM public.users
    WHERE id = auth.uid();

    IF user_record IS NULL THEN
        RETURN false;
    END IF;

    -- Reset daily count if it's a new day
    IF user_record.daily_readings_reset_date < CURRENT_DATE THEN
        UPDATE public.users
        SET daily_readings_count = 0,
            daily_readings_reset_date = CURRENT_DATE
        WHERE id = auth.uid();
        user_record.daily_readings_count := 0;
    END IF;

    -- Set higher limits for premium users
    IF user_record.is_premium THEN
        max_readings := 50;
    END IF;

    RETURN user_record.daily_readings_count < max_readings;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to increment daily reading count
CREATE OR REPLACE FUNCTION auth.increment_daily_readings()
RETURNS VOID AS $$
BEGIN
    UPDATE public.users
    SET daily_readings_count = daily_readings_count + 1,
        total_readings = total_readings + 1
    WHERE id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enhanced RLS Policies

-- Wasteland Cards - Enhanced with premium content
DROP POLICY IF EXISTS "Anyone can read wasteland cards" ON public.wasteland_cards;
CREATE POLICY "Anyone can read wasteland cards" ON public.wasteland_cards
    FOR SELECT USING (
        is_active = true AND
        (rarity_level != 'legendary' OR auth.is_premium())
    );

-- Admin access for card management
CREATE POLICY "Admins can manage cards" ON public.wasteland_cards
    FOR ALL USING (auth.is_admin());

-- Users table - Enhanced privacy protection
DROP POLICY IF EXISTS "Users can read their own data" ON public.users;
CREATE POLICY "Users can read their own data" ON public.users
    FOR SELECT USING (
        auth.uid() = id OR
        (public_profile = true AND is_active = true)
    );

DROP POLICY IF EXISTS "Users can update their own data" ON public.users;
CREATE POLICY "Users can update their own data" ON public.users
    FOR UPDATE USING (auth.uid() = id)
    WITH CHECK (
        auth.uid() = id AND
        -- Prevent users from escalating privileges
        (NEW.is_admin = OLD.is_admin OR auth.is_admin()) AND
        (NEW.is_premium = OLD.is_premium OR auth.is_admin()) AND
        -- Validate email format
        NEW.email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
    );

-- Reading sessions - Enhanced with friendship and rate limiting
DROP POLICY IF EXISTS "Users can manage their own reading sessions" ON public.reading_sessions;
CREATE POLICY "Users can manage their own reading sessions" ON public.reading_sessions
    FOR ALL USING (auth.uid() = user_id);

-- Special policy for creating new sessions with rate limiting
CREATE POLICY "Users can create reading sessions with limits" ON public.reading_sessions
    FOR INSERT WITH CHECK (
        auth.uid() = user_id AND
        auth.can_create_reading()
    );

-- Enhanced public reading access
DROP POLICY IF EXISTS "Public reading sessions are readable" ON public.reading_sessions;
CREATE POLICY "Public reading sessions are readable" ON public.reading_sessions
    FOR SELECT USING (
        allow_public_sharing = true AND
        session_state = 'completed' AND
        is_private = false AND
        user_id IN (SELECT id FROM public.users WHERE is_active = true)
    );

-- Enhanced friend access
DROP POLICY IF EXISTS "Friends can read shared sessions" ON public.reading_sessions;
CREATE POLICY "Friends can read shared sessions" ON public.reading_sessions
    FOR SELECT USING (
        share_with_friends = true AND
        session_state = 'completed' AND
        auth.are_friends(auth.uid(), user_id)
    );

-- Spread templates - Premium templates
DROP POLICY IF EXISTS "Anyone can read active spread templates" ON public.spread_templates;
CREATE POLICY "Anyone can read active spread templates" ON public.spread_templates
    FOR SELECT USING (
        is_active = true AND
        (is_premium = false OR auth.is_premium())
    );

CREATE POLICY "Admins can manage spread templates" ON public.spread_templates
    FOR ALL USING (auth.is_admin());

-- User achievements - Prevent tampering
DROP POLICY IF EXISTS "System can insert achievements" ON public.user_achievements;
CREATE POLICY "Backend can insert achievements" ON public.user_achievements
    FOR INSERT WITH CHECK (
        -- Only allow insertions from backend service role or admin
        auth.is_admin() OR
        current_setting('role', true) = 'service_role'
    );

DROP POLICY IF EXISTS "Users can update their achievement progress" ON public.user_achievements;
CREATE POLICY "Users can view achievement progress" ON public.user_achievements
    FOR UPDATE USING (false); -- Prevent direct updates

-- Karma history - Read-only for users
DROP POLICY IF EXISTS "System can insert karma changes" ON public.karma_history;
CREATE POLICY "Backend can insert karma changes" ON public.karma_history
    FOR INSERT WITH CHECK (
        auth.is_admin() OR
        current_setting('role', true) = 'service_role'
    );

-- User friendships - Enhanced validation
DROP POLICY IF EXISTS "Users can create friend requests" ON public.user_friendships;
CREATE POLICY "Users can create friend requests" ON public.user_friendships
    FOR INSERT WITH CHECK (
        auth.uid() = requester_id AND
        requester_id != addressee_id AND
        -- Check recipient allows friend requests
        addressee_id IN (
            SELECT id FROM public.users
            WHERE allow_friend_requests = true AND is_active = true
        ) AND
        -- Prevent duplicate requests
        NOT EXISTS (
            SELECT 1 FROM public.user_friendships
            WHERE (requester_id = NEW.requester_id AND addressee_id = NEW.addressee_id)
               OR (requester_id = NEW.addressee_id AND addressee_id = NEW.requester_id)
        )
    );

DROP POLICY IF EXISTS "Users can update their own friendship status" ON public.user_friendships;
CREATE POLICY "Users can update friendship status" ON public.user_friendships
    FOR UPDATE USING (
        auth.uid() = requester_id OR auth.uid() = addressee_id
    ) WITH CHECK (
        -- Only allow certain status transitions
        (OLD.status = 'pending' AND NEW.status IN ('accepted', 'declined', 'blocked')) OR
        (OLD.status = 'accepted' AND NEW.status = 'blocked') OR
        (OLD.status IN ('declined', 'blocked') AND NEW.status = 'pending' AND auth.uid() = requester_id)
    );

-- Card synergies - Admin only for modifications
CREATE POLICY "Users can read card synergies" ON public.card_synergies
    FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage card synergies" ON public.card_synergies
    FOR ALL USING (auth.is_admin());

-- Data integrity triggers

-- Trigger to update user statistics on reading completion
CREATE OR REPLACE FUNCTION update_user_reading_stats()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.session_state = 'completed' AND OLD.session_state != 'completed' THEN
        -- Increment daily and total reading counts
        PERFORM auth.increment_daily_readings();

        -- Update user profile statistics
        UPDATE public.user_profiles
        SET total_readings = total_readings + 1
        WHERE user_id = NEW.user_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_update_reading_stats
    AFTER UPDATE ON public.reading_sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_user_reading_stats();

-- Trigger to maintain friendship counts
CREATE OR REPLACE FUNCTION update_friendship_counts()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
        IF NEW.status = 'accepted' THEN
            -- Increment friend count for both users
            UPDATE public.user_profiles
            SET friends_count = friends_count + 1
            WHERE user_id IN (NEW.requester_id, NEW.addressee_id);
        END IF;
    END IF;

    IF TG_OP = 'DELETE' OR (TG_OP = 'UPDATE' AND OLD.status = 'accepted' AND NEW.status != 'accepted') THEN
        -- Decrement friend count for both users
        UPDATE public.user_profiles
        SET friends_count = friends_count - 1
        WHERE user_id IN (OLD.requester_id, OLD.addressee_id)
          AND friends_count > 0;
    END IF;

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_update_friendship_counts
    AFTER INSERT OR UPDATE OR DELETE ON public.user_friendships
    FOR EACH ROW
    EXECUTE FUNCTION update_friendship_counts();

-- Trigger to track karma changes
CREATE OR REPLACE FUNCTION track_karma_changes()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.karma_score != OLD.karma_score THEN
        INSERT INTO public.karma_history (
            user_id,
            previous_karma,
            new_karma,
            karma_change,
            change_reason,
            automatic_change
        ) VALUES (
            NEW.id,
            OLD.karma_score,
            NEW.karma_score,
            NEW.karma_score - OLD.karma_score,
            'Manual karma adjustment',
            false
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_track_karma_changes
    AFTER UPDATE ON public.users
    FOR EACH ROW
    EXECUTE FUNCTION track_karma_changes();

-- Security audit log table
CREATE TABLE public.security_audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id),
    action VARCHAR(100) NOT NULL,
    table_name VARCHAR(100),
    record_id VARCHAR(100),
    ip_address INET,
    user_agent TEXT,
    success BOOLEAN DEFAULT true,
    error_message TEXT,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on audit log
ALTER TABLE public.security_audit_log ENABLE ROW LEVEL SECURITY;

-- Only admins can read audit logs
CREATE POLICY "Admins can read audit logs" ON public.security_audit_log
    FOR SELECT USING (auth.is_admin());

-- Backend can insert audit logs
CREATE POLICY "Backend can insert audit logs" ON public.security_audit_log
    FOR INSERT WITH CHECK (
        current_setting('role', true) = 'service_role' OR
        auth.is_admin()
    );

-- Audit trigger function
CREATE OR REPLACE FUNCTION audit_table_activity()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.security_audit_log (
        user_id,
        action,
        table_name,
        record_id,
        success,
        metadata
    ) VALUES (
        auth.uid(),
        TG_OP,
        TG_TABLE_NAME,
        COALESCE(NEW.id::text, OLD.id::text),
        true,
        jsonb_build_object(
            'old', to_jsonb(OLD),
            'new', to_jsonb(NEW)
        )
    );

    RETURN COALESCE(NEW, OLD);
EXCEPTION WHEN OTHERS THEN
    -- Log the error but don't fail the original operation
    INSERT INTO public.security_audit_log (
        user_id,
        action,
        table_name,
        record_id,
        success,
        error_message
    ) VALUES (
        auth.uid(),
        TG_OP,
        TG_TABLE_NAME,
        COALESCE(NEW.id::text, OLD.id::text),
        false,
        SQLERRM
    );

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply audit triggers to sensitive tables
CREATE TRIGGER audit_users AFTER INSERT OR UPDATE OR DELETE ON public.users
    FOR EACH ROW EXECUTE FUNCTION audit_table_activity();

CREATE TRIGGER audit_reading_sessions AFTER INSERT OR UPDATE OR DELETE ON public.reading_sessions
    FOR EACH ROW EXECUTE FUNCTION audit_table_activity();

CREATE TRIGGER audit_user_friendships AFTER INSERT OR UPDATE OR DELETE ON public.user_friendships
    FOR EACH ROW EXECUTE FUNCTION audit_table_activity();

SELECT 'Enhanced security policies and audit system created successfully!
Features:
- Rate limiting for readings
- Premium content protection
- Friendship validation
- Karma change tracking
- Comprehensive audit logging
- Admin privilege protection' as result;