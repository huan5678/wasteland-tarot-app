/**
 * TypeScript type definitions for Wasteland Tarot database schema
 * Auto-generated from Supabase schema
 * Created: 2025-01-28
 */

export interface Database {
  public: {
    Tables: {
      wasteland_cards: {
        Row: WastelandCard;
        Insert: WastelandCardInsert;
        Update: WastelandCardUpdate;
      };
      users: {
        Row: User;
        Insert: UserInsert;
        Update: UserUpdate;
      };
      user_profiles: {
        Row: UserProfile;
        Insert: UserProfileInsert;
        Update: UserProfileUpdate;
      };
      user_preferences: {
        Row: UserPreferences;
        Insert: UserPreferencesInsert;
        Update: UserPreferencesUpdate;
      };
      spread_templates: {
        Row: SpreadTemplate;
        Insert: SpreadTemplateInsert;
        Update: SpreadTemplateUpdate;
      };
      interpretation_templates: {
        Row: InterpretationTemplate;
        Insert: InterpretationTemplateInsert;
        Update: InterpretationTemplateUpdate;
      };
      reading_sessions: {
        Row: SavedSession;
        Insert: SavedSessionInsert;
        Update: SavedSessionUpdate;
      };
      completed_readings: {
        Row: CompletedReading;
        Insert: CompletedReadingInsert;
        Update: CompletedReadingUpdate;
      };
      session_events: {
        Row: SessionEvent;
        Insert: SessionEventInsert;
        Update: SessionEventUpdate;
      };
      reading_card_positions: {
        Row: ReadingCardPosition;
        Insert: ReadingCardPositionInsert;
        Update: ReadingCardPositionUpdate;
      };
      card_synergies: {
        Row: CardSynergy;
        Insert: CardSynergyInsert;
        Update: CardSynergyUpdate;
      };
      user_achievements: {
        Row: UserAchievement;
        Insert: UserAchievementInsert;
        Update: UserAchievementUpdate;
      };
      karma_history: {
        Row: KarmaHistory;
        Insert: KarmaHistoryInsert;
        Update: KarmaHistoryUpdate;
      };
      user_friendships: {
        Row: UserFriendship;
        Insert: UserFriendshipInsert;
        Update: UserFriendshipUpdate;
      };
    };
    Views: {
      popular_cards: {
        Row: PopularCard;
      };
      user_statistics: {
        Row: UserStatistics;
      };
      friend_recommendations: {
        Row: FriendRecommendation;
      };
    };
  };
}

// Enums
export type WastelandSuit =
  | 'MAJOR_ARCANA'
  | 'NUKA_COLA_BOTTLES'
  | 'COMBAT_WEAPONS'
  | 'BOTTLE_CAPS'
  | 'RADIATION_RODS';

export type CardRarity = 'common' | 'uncommon' | 'rare' | 'legendary';

export type FactionAlignment =
  | 'brotherhood'
  | 'ncr'
  | 'legion'
  | 'raiders'
  | 'vault_dweller'
  | 'independent';

export type CharacterVoice =
  | 'pip_boy'
  | 'vault_dweller'
  | 'wasteland_trader'
  | 'super_mutant'
  | 'codsworth';

export type KarmaAlignment = 'good' | 'neutral' | 'evil';

export type SessionState = 'in_progress' | 'completed' | 'abandoned';

export type FriendshipStatus = 'pending' | 'accepted' | 'blocked' | 'declined';

export type SynergyType = 'complementary' | 'conflicting' | 'amplifying' | 'neutralizing';

export type SubscriptionTier = 'free' | 'premium' | 'vault_dweller' | 'overseer';

export type DifficultyLevel = 'beginner' | 'intermediate' | 'advanced' | 'expert';

export type NotificationLevel = 'none' | 'minimal' | 'normal' | 'all';

// Core table interfaces
export interface WastelandCard {
  // Primary identification
  id: string;
  name: string;
  suit: WastelandSuit;
  card_number: number;
  number: number; // Alias for card_number (backwards compatibility)

  // Core tarot meanings
  upright_meaning: string;
  reversed_meaning: string;
  description?: string;
  keywords?: string[];

  // Visual representation
  image_url: string;
  audio_cue_url?: string;

  // Fallout-specific attributes
  radiation_factor: number; // 0.0 to 1.0
  karma_alignment: 'GOOD' | 'NEUTRAL' | 'EVIL';
  fallout_reference?: string;

  // Symbolism and spiritual aspects
  symbolism?: string;
  element?: string;
  astrological_association?: string;

  // Character voice interpretations
  character_voice_interpretations: Record<string, string>;
  pip_boy_interpretation?: string;
  super_mutant_interpretation?: string;
  ghoul_interpretation?: string;
  raider_interpretation?: string;
  brotherhood_scribe_interpretation?: string;
  vault_dweller_interpretation?: string;
  codsworth_interpretation?: string;

  // Extended Fallout universe elements
  vault_reference?: number;
  threat_level?: number;
  wasteland_humor?: string;
  nuka_cola_reference?: string;
  special_ability?: string;

  // Usage and feedback statistics
  draw_frequency?: number;
  total_appearances?: number;
  positive_feedback_count?: number;
  negative_feedback_count?: number;
  average_rating?: number;

  // Metadata and status
  rarity_level: CardRarity;
  is_active: boolean;
  is_complete: boolean;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: string;
  email: string;
  name: string;  // Changed from username in backend schema
  /** @deprecated Use name instead. Kept for backwards compatibility */
  username?: string;  // Alias for name (deprecated)
  display_name?: string;
  bio?: string;
  avatar_url?: string;
  faction_alignment: FactionAlignment;
  karma_score: number;
  vault_number?: number;
  wasteland_location?: string;
  is_active: boolean;
  is_verified: boolean;
  is_premium: boolean;
  subscription_tier: SubscriptionTier;
  subscription_expires_at?: string;
  total_readings: number;
  daily_readings_count: number;
  daily_readings_reset_date: string;
  accurate_predictions: number;
  community_points: number;
  experience_points: number;
  current_level: number;
  allow_friend_requests: boolean;
  public_profile: boolean;
  last_login?: string;
  failed_login_attempts: number;
  account_locked_until?: string;
  data_collection_consent: boolean;
  marketing_consent: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserProfile {
  id: string;
  user_id: string;
  preferred_voice: CharacterVoice;
  vault_backstory?: string;
  faction_rank?: string;
  special_stats: SPECIALStats;
  perks_unlocked?: string[];
  favorite_card_suit?: WastelandSuit;
  preferred_spread_types?: string[];
  interpretation_style: string;
  achievements_earned?: string[];
  badges_collected?: string[];
  milestone_dates: Record<string, string>;
  friends_count: number;
  readings_shared: number;
  community_contributions: number;
  reputation_score: number;
  timezone: string;
  language_preference: string;
  accessibility_settings: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface SPECIALStats {
  strength: number;
  perception: number;
  endurance: number;
  charisma: number;
  intelligence: number;
  agility: number;
  luck: number;
}

export interface UserPreferences {
  id: string;
  user_id: string;
  default_character_voice: CharacterVoice;
  auto_save_readings: boolean;
  share_readings_publicly: boolean;
  favorite_spread_types: string[];
  karma_influence_level: string;
  theme: string;
  pip_boy_color: string;
  terminal_effects: boolean;
  sound_effects: boolean;
  background_music: boolean;
  geiger_counter_volume: number;
  voice_volume: number;
  ambient_volume: number;
  preferred_card_back: string;
  card_animation_speed: string;
  show_radiation_effects: boolean;
  email_notifications: boolean;
  daily_reading_reminder: boolean;
  friend_activity_notifications: boolean;
  achievement_notifications: boolean;
  reading_reminder_time?: string;
  public_profile: boolean;
  allow_friend_requests: boolean;
  share_reading_history: boolean;
  high_contrast_mode: boolean;
  large_text_mode: boolean;
  screen_reader_mode: boolean;
  reduced_motion: boolean;
  keyboard_navigation: boolean;
  created_at: string;
  updated_at: string;
}

export interface SpreadTemplate {
  id: string;
  name: string;
  slug: string;
  description: string;
  card_count: number;
  position_names: string[];
  position_meanings: string[];
  layout_config: LayoutConfig;
  fallout_theme?: string;
  difficulty_level: DifficultyLevel;
  faction_association?: FactionAlignment;
  usage_count: number;
  average_rating: number;
  is_active: boolean;
  is_premium: boolean;
  creator_notes?: string;
  created_at: string;
  updated_at: string;
}

export interface LayoutConfig {
  positions: CardPosition[];
  background?: string;
  special_effects?: Record<string, any>;
}

export interface CardPosition {
  x: number;
  y: number;
  rotation: number;
  scale?: number;
}

export interface InterpretationTemplate {
  id: string;
  character_voice: CharacterVoice;
  template_name: string;
  intro_phrases: string[];
  card_interpretation_format: string;
  conclusion_phrases: string[];
  transition_phrases: string[];
  personality_traits: Record<string, boolean>;
  speaking_style: string;
  favorite_expressions: string[];
  fallout_references: string[];
  is_active: boolean;
  usage_weight: number;
  created_at: string;
  updated_at: string;
}

// SavedSession represents incomplete reading sessions (reading_sessions table)
// This is for the save/resume feature where users can pause and continue later
export interface SavedSession {
  id: string;
  user_id: string;
  spread_type: string;
  question?: string;
  selected_cards: any[];  // JSONB array of selected cards
  current_position: number;
  session_data: Record<string, any>;  // JSONB metadata
  device_info?: Record<string, any>;  // JSONB device information
  status: 'active' | 'paused' | 'complete';
  started_at: string;
  last_accessed_at: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;
}

// CompletedReading represents finished reading sessions (completed_readings table)
// This includes full interpretation and social features
export interface CompletedReading {
  id: string;
  user_id: string;
  spread_template_id?: string;
  interpretation_template_id?: string;
  question: string;
  focus_area?: string;  // career, relationships, health, etc.
  context_notes?: string;
  character_voice_used: CharacterVoice;
  karma_context: string;
  faction_influence?: FactionAlignment;
  radiation_factor?: number;
  overall_interpretation?: string;
  summary_message?: string;
  prediction_confidence?: number;  // 0.0 to 1.0
  energy_reading?: Record<string, any>;  // JSONB
  session_duration?: number;  // seconds
  start_time?: string;
  end_time?: string;
  location?: string;
  mood_before?: string;
  mood_after?: string;
  privacy_level: 'private' | 'friends' | 'public';
  allow_public_sharing: boolean;
  is_favorite?: boolean;
  share_with_friends?: boolean;
  anonymous_sharing?: boolean;
  shared_with_users?: string[];  // JSONB array
  user_satisfaction?: number;  // 1-5 rating
  accuracy_rating?: number;  // 1-5 rating
  helpful_rating?: number;  // 1-5 rating
  user_feedback?: string;
  tags?: string[];  // JSONB array
  likes_count?: number;
  shares_count?: number;
  comments_count?: number;
  created_at: string;
  updated_at: string;
}

// SessionEvent represents events during reading sessions (session_events table)
// Immutable audit log for analytics and debugging
export interface SessionEvent {
  id: string;
  session_id: string;  // FK to reading_sessions.id
  user_id: string;
  event_type: string;
  event_data: Record<string, any>;  // JSONB
  card_position?: number;
  timestamp: string;
  user_agent?: string;
  ip_address?: string;
  created_at: string;
}

/**
 * @deprecated Use SavedSession for incomplete sessions or CompletedReading for finished readings
 * This type is kept for backwards compatibility but will be removed in future versions
 */
export type ReadingSession = CompletedReading;

export interface ReadingCardPosition {
  id: string;
  session_id: string;
  card_id: string;
  position_index: number;
  position_name: string;
  position_meaning?: string;
  is_reversed: boolean;
  drawn_at: string;
  individual_interpretation?: string;
  position_significance?: string;
  card_synergy_notes?: string;
  created_at: string;
}

export interface CardSynergy {
  id: string;
  primary_card_id: string;
  secondary_card_id: string;
  synergy_type: SynergyType;
  synergy_strength: number;
  synergy_description?: string;
  applicable_spreads?: string[];
  position_requirements?: Record<string, any>;
  karma_conditions?: string[];
  faction_conditions?: string[];
  occurrence_count: number;
  user_feedback_score: number;
  is_active: boolean;
  created_at: string;
}

export interface UserAchievement {
  id: string;
  user_id: string;
  achievement_id: string;
  achievement_name: string;
  achievement_description?: string;
  achievement_category?: string;
  current_progress: number;
  required_progress: number;
  progress_percentage: number;
  is_completed: boolean;
  completed_at?: string;
  experience_reward: number;
  community_points_reward: number;
  special_rewards?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface KarmaHistory {
  id: string;
  user_id: string;
  previous_karma: number;
  new_karma: number;
  karma_change: number;
  change_reason: string;
  related_reading_id?: string;
  related_action?: string;
  automatic_change: boolean;
  admin_override: boolean;
  notes?: string;
  created_at: string;
}

export interface UserFriendship {
  id: string;
  requester_id: string;
  addressee_id: string;
  status: FriendshipStatus;
  established_at?: string;
  can_view_readings: boolean;
  can_comment_readings: boolean;
  notification_level: NotificationLevel;
  shared_readings_count: number;
  mutual_friends_count: number;
  last_interaction?: string;
  created_at: string;
  updated_at: string;
}

// Insert types (fields that can be omitted during creation)
export type WastelandCardInsert = Omit<WastelandCard, 'id' | 'created_at' | 'updated_at'> & {
  id?: string;
  created_at?: string;
  updated_at?: string;
};

export type UserInsert = Omit<User, 'id' | 'created_at' | 'updated_at'> & {
  id?: string;
  created_at?: string;
  updated_at?: string;
};

export type UserProfileInsert = Omit<UserProfile, 'id' | 'created_at' | 'updated_at'> & {
  id?: string;
  created_at?: string;
  updated_at?: string;
};

export type UserPreferencesInsert = Omit<UserPreferences, 'id' | 'created_at' | 'updated_at'> & {
  id?: string;
  created_at?: string;
  updated_at?: string;
};

export type SpreadTemplateInsert = Omit<SpreadTemplate, 'id' | 'created_at' | 'updated_at'> & {
  id?: string;
  created_at?: string;
  updated_at?: string;
};

export type InterpretationTemplateInsert = Omit<InterpretationTemplate, 'id' | 'created_at' | 'updated_at'> & {
  id?: string;
  created_at?: string;
  updated_at?: string;
};

export type SavedSessionInsert = Omit<SavedSession, 'id' | 'created_at' | 'updated_at'> & {
  id?: string;
  created_at?: string;
  updated_at?: string;
};

export type CompletedReadingInsert = Omit<CompletedReading, 'id' | 'created_at' | 'updated_at'> & {
  id?: string;
  created_at?: string;
  updated_at?: string;
};

export type SessionEventInsert = Omit<SessionEvent, 'id' | 'created_at'> & {
  id?: string;
  created_at?: string;
};

/**
 * @deprecated Use SavedSessionInsert or CompletedReadingInsert instead
 */
export type ReadingSessionInsert = CompletedReadingInsert;

export type ReadingCardPositionInsert = Omit<ReadingCardPosition, 'id' | 'created_at'> & {
  id?: string;
  created_at?: string;
};

export type CardSynergyInsert = Omit<CardSynergy, 'id' | 'created_at'> & {
  id?: string;
  created_at?: string;
};

export type UserAchievementInsert = Omit<UserAchievement, 'id' | 'created_at' | 'updated_at'> & {
  id?: string;
  created_at?: string;
  updated_at?: string;
};

export type KarmaHistoryInsert = Omit<KarmaHistory, 'id' | 'created_at'> & {
  id?: string;
  created_at?: string;
};

export type UserFriendshipInsert = Omit<UserFriendship, 'id' | 'created_at' | 'updated_at'> & {
  id?: string;
  created_at?: string;
  updated_at?: string;
};

// Update types (all fields optional except id)
export type WastelandCardUpdate = Partial<Omit<WastelandCard, 'id' | 'created_at'>> & {
  updated_at?: string;
};

export type UserUpdate = Partial<Omit<User, 'id' | 'created_at'>> & {
  updated_at?: string;
};

export type UserProfileUpdate = Partial<Omit<UserProfile, 'id' | 'created_at'>> & {
  updated_at?: string;
};

export type UserPreferencesUpdate = Partial<Omit<UserPreferences, 'id' | 'created_at'>> & {
  updated_at?: string;
};

export type SpreadTemplateUpdate = Partial<Omit<SpreadTemplate, 'id' | 'created_at'>> & {
  updated_at?: string;
};

export type InterpretationTemplateUpdate = Partial<Omit<InterpretationTemplate, 'id' | 'created_at'>> & {
  updated_at?: string;
};

export type SavedSessionUpdate = Partial<Omit<SavedSession, 'id' | 'created_at'>> & {
  updated_at?: string;
};

export type CompletedReadingUpdate = Partial<Omit<CompletedReading, 'id' | 'created_at'>> & {
  updated_at?: string;
};

export type SessionEventUpdate = Partial<Omit<SessionEvent, 'id' | 'created_at'>>;

/**
 * @deprecated Use SavedSessionUpdate or CompletedReadingUpdate instead
 */
export type ReadingSessionUpdate = CompletedReadingUpdate;

export type ReadingCardPositionUpdate = Partial<Omit<ReadingCardPosition, 'id' | 'created_at'>>;

export type CardSynergyUpdate = Partial<Omit<CardSynergy, 'id' | 'created_at'>>;

export type UserAchievementUpdate = Partial<Omit<UserAchievement, 'id' | 'created_at'>> & {
  updated_at?: string;
};

export type KarmaHistoryUpdate = Partial<Omit<KarmaHistory, 'id' | 'created_at'>>;

export type UserFriendshipUpdate = Partial<Omit<UserFriendship, 'id' | 'created_at'>> & {
  updated_at?: string;
};

// View interfaces
export interface PopularCard extends WastelandCard {
  current_usage_count: number;
  average_user_rating: number;
}

export interface UserStatistics {
  id: string;
  username: string;
  display_name?: string;
  faction_alignment: FactionAlignment;
  karma_score: number;
  current_level: number;
  total_readings: number;
  community_points: number;
  friends_count: number;
  reputation_score: number;
  completed_readings: number;
  avg_session_duration: number;
  avg_accuracy_rating: number;
  total_achievements: number;
  karma_title: string;
}

export interface FriendRecommendation {
  user_id: string;
  recommended_user_id: string;
  recommended_username: string;
  recommended_display_name?: string;
  compatibility_score: number;
}

// Utility types for API responses
export interface APIResponse<T> {
  data?: T;
  error?: {
    message: string;
    code?: string;
    details?: any;
  };
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ReadingResult {
  session: ReadingSession;
  cards: (ReadingCardPosition & { card: WastelandCard })[];
  interpretation: string;
  synergies?: CardSynergy[];
}

export interface UserDashboard {
  user: User;
  profile: UserProfile;
  preferences: UserPreferences;
  recentReadings: ReadingSession[];
  achievements: UserAchievement[];
  karmaHistory: KarmaHistory[];
  friends: UserFriendship[];
  statistics: UserStatistics;
}

// Export default database type for Supabase client
export default Database;