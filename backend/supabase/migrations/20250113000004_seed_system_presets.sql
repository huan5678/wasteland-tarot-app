-- Migration: Seed system preset patterns
-- Description: 插入 5 個系統預設節奏 Pattern（Techno, House, Trap, Breakbeat, Minimal）
-- Created: 2025-01-13
-- Feature: playlist-music-player (v4.0)

-- ============================================================================
-- 系統預設 Pattern 種子資料
-- ============================================================================

-- 系統預設 Pattern 使用 NULL user_id（表示無擁有者）
DO $$
BEGIN
    -- ────────────────────────────────────────────────────────────────────────
    -- 1. Techno Pattern
    -- ────────────────────────────────────────────────────────────────────────
    INSERT INTO public.user_rhythm_presets (
        id,
        user_id,
        name,
        description,
        pattern,
        is_system_preset,
        is_public
    ) VALUES (
        '10000000-0000-0000-0000-000000000001'::uuid,
        NULL,
        'Techno',
        '經典 Techno 四四拍節奏，強勁的 Kick 和規律的 Hi-Hat',
        '{
            "kick":    [true, false, false, false, true, false, false, false, true, false, false, false, true, false, false, false],
            "snare":   [false, false, false, false, true, false, false, false, false, false, false, false, true, false, false, false],
            "hihat":   [false, false, true, false, false, false, true, false, false, false, true, false, false, false, true, false],
            "openhat": [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, true],
            "clap":    [false, false, false, false, true, false, false, false, false, false, false, false, true, false, false, false]
        }'::jsonb,
        true,
        true
    )
    ON CONFLICT (id) DO NOTHING;

    -- ────────────────────────────────────────────────────────────────────────
    -- 2. House Pattern
    -- ────────────────────────────────────────────────────────────────────────
    INSERT INTO public.user_rhythm_presets (
        id,
        user_id,
        name,
        description,
        pattern,
        is_system_preset,
        is_public
    ) VALUES (
        '10000000-0000-0000-0000-000000000002'::uuid,
        NULL,
        'House',
        'House 音樂節奏，持續的四四拍 Kick 和活潑的 Hi-Hat',
        '{
            "kick":    [true, false, false, false, true, false, false, false, true, false, false, false, true, false, false, false],
            "snare":   [false, false, false, false, true, false, false, false, false, false, false, false, true, false, false, false],
            "hihat":   [true, false, true, false, true, false, true, false, true, false, true, false, true, false, true, false],
            "openhat": [false, false, false, true, false, false, false, true, false, false, false, true, false, false, false, true],
            "clap":    [false, false, false, false, true, false, false, false, false, false, false, false, true, false, false, false]
        }'::jsonb,
        true,
        true
    )
    ON CONFLICT (id) DO NOTHING;

    -- ────────────────────────────────────────────────────────────────────────
    -- 3. Trap Pattern
    -- ────────────────────────────────────────────────────────────────────────
    INSERT INTO public.user_rhythm_presets (
        id,
        user_id,
        name,
        description,
        pattern,
        is_system_preset,
        is_public
    ) VALUES (
        '10000000-0000-0000-0000-000000000003'::uuid,
        NULL,
        'Trap',
        'Trap 風格節奏，重低音 Kick 和快速的 Hi-Hat roll',
        '{
            "kick":    [true, false, false, false, false, false, false, true, false, false, true, false, false, false, false, false],
            "snare":   [false, false, false, false, false, false, false, false, true, false, false, false, false, false, false, false],
            "hihat":   [true, false, true, false, true, false, true, false, true, true, false, true, false, true, true, true],
            "openhat": [false, false, false, false, false, false, false, false, false, false, false, false, false, true, false, false],
            "clap":    [false, false, false, false, false, false, false, false, true, false, false, false, false, false, false, false]
        }'::jsonb,
        true,
        true
    )
    ON CONFLICT (id) DO NOTHING;

    -- ────────────────────────────────────────────────────────────────────────
    -- 4. Breakbeat Pattern
    -- ────────────────────────────────────────────────────────────────────────
    INSERT INTO public.user_rhythm_presets (
        id,
        user_id,
        name,
        description,
        pattern,
        is_system_preset,
        is_public
    ) VALUES (
        '10000000-0000-0000-0000-000000000004'::uuid,
        NULL,
        'Breakbeat',
        'Breakbeat 碎拍節奏，不規則的 Kick 和 Snare 組合',
        '{
            "kick":    [true, false, false, false, false, false, true, false, false, true, false, false, false, false, false, false],
            "snare":   [false, false, false, false, true, false, false, false, false, false, false, true, false, false, true, false],
            "hihat":   [true, false, true, false, true, false, true, false, true, false, true, false, true, false, true, false],
            "openhat": [false, false, false, true, false, false, false, false, false, false, false, false, false, false, false, true],
            "clap":    [false, false, false, false, true, false, false, false, false, false, false, true, false, false, false, false]
        }'::jsonb,
        true,
        true
    )
    ON CONFLICT (id) DO NOTHING;

    -- ────────────────────────────────────────────────────────────────────────
    -- 5. Minimal Pattern
    -- ────────────────────────────────────────────────────────────────────────
    INSERT INTO public.user_rhythm_presets (
        id,
        user_id,
        name,
        description,
        pattern,
        is_system_preset,
        is_public
    ) VALUES (
        '10000000-0000-0000-0000-000000000005'::uuid,
        NULL,
        'Minimal',
        'Minimal 極簡節奏，稀疏的鼓點和空間感',
        '{
            "kick":    [true, false, false, false, false, false, false, false, true, false, false, false, false, false, false, false],
            "snare":   [false, false, false, false, false, false, false, false, false, false, false, false, true, false, false, false],
            "hihat":   [false, false, false, true, false, false, false, false, false, false, true, false, false, false, false, false],
            "openhat": [false, false, false, false, false, false, false, true, false, false, false, false, false, false, false, false],
            "clap":    [false, false, false, false, false, false, false, false, false, false, false, false, true, false, false, false]
        }'::jsonb,
        true,
        true
    )
    ON CONFLICT (id) DO NOTHING;

    -- 記錄種子資料執行結果
    RAISE NOTICE '✓ 已成功插入 5 個系統預設 Pattern (Techno, House, Trap, Breakbeat, Minimal)';

END $$;

-- ============================================================================
-- 驗證種子資料
-- ============================================================================

-- 查詢系統預設 Pattern 數量（應為 5）
DO $$
DECLARE
    preset_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO preset_count
    FROM public.user_rhythm_presets
    WHERE is_system_preset = TRUE;

    IF preset_count = 5 THEN
        RAISE NOTICE '✓ 驗證通過：系統預設 Pattern 數量正確 (5 個)';
    ELSE
        RAISE WARNING '⚠ 驗證失敗：系統預設 Pattern 數量異常 (% 個，預期 5 個)', preset_count;
    END IF;
END $$;
