/**
 * Supabase Edge Function: 每月賓果重置
 *
 * 排程: 每月1日 16:00 UTC (00:00 UTC+8)
 * 觸發: pg_cron 或手動 HTTP 請求
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

interface ResetResult {
  success: boolean
  reset_date: string
  archived_cards: number
  archived_claims: number
  archived_rewards: number
  archived_numbers: number
  cleared_records: number
  partition_created: boolean
  error?: string
}

serve(async (req) => {
  try {
    // CORS 處理
    if (req.method === 'OPTIONS') {
      return new Response('ok', {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
        }
      })
    }

    // 初始化 Supabase Client (使用 service_role 權限)
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // 計算上月日期範圍 (UTC+8)
    const now = new Date(new Date().getTime() + 8 * 60 * 60 * 1000)
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const lastMonthStart = lastMonth.toISOString().slice(0, 10)
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10)

    console.log(`Starting monthly reset for period: ${lastMonthStart} to ${lastMonthEnd}`)

    const result: ResetResult = {
      success: true,
      reset_date: now.toISOString().slice(0, 10),
      archived_cards: 0,
      archived_claims: 0,
      archived_rewards: 0,
      archived_numbers: 0,
      cleared_records: 0,
      partition_created: false
    }

    // 1. 歸檔賓果卡資料
    console.log('Archiving bingo cards...')
    const { data: cardsToArchive, error: cardsSelectError } = await supabaseClient
      .from('user_bingo_cards')
      .select('*')
      .gte('month_year', lastMonthStart)
      .lt('month_year', lastMonthEnd)

    if (cardsSelectError) throw cardsSelectError

    if (cardsToArchive && cardsToArchive.length > 0) {
      // 插入到歷史表
      const cardsWithArchiveDate = cardsToArchive.map(card => ({
        ...card,
        archived_at: new Date().toISOString()
      }))

      const { error: cardsInsertError } = await supabaseClient
        .from('user_bingo_cards_history')
        .insert(cardsWithArchiveDate)

      if (cardsInsertError) throw cardsInsertError

      // 從主表刪除
      const { error: cardsDeleteError } = await supabaseClient
        .from('user_bingo_cards')
        .delete()
        .gte('month_year', lastMonthStart)
        .lt('month_year', lastMonthEnd)

      if (cardsDeleteError) throw cardsDeleteError

      result.archived_cards = cardsToArchive.length
      console.log(`Archived ${result.archived_cards} bingo cards`)
    }

    // 2. 歸檔領取記錄
    console.log('Archiving number claims...')
    const { data: claimsToArchive, error: claimsSelectError } = await supabaseClient
      .from('user_number_claims')
      .select('*')
      .gte('claimed_at', lastMonthStart)
      .lt('claimed_at', lastMonthEnd)

    if (claimsSelectError) throw claimsSelectError

    if (claimsToArchive && claimsToArchive.length > 0) {
      const claimsWithArchiveDate = claimsToArchive.map(claim => ({
        ...claim,
        archived_at: new Date().toISOString()
      }))

      const { error: claimsInsertError } = await supabaseClient
        .from('user_number_claims_history')
        .insert(claimsWithArchiveDate)

      if (claimsInsertError) throw claimsInsertError

      const { error: claimsDeleteError } = await supabaseClient
        .from('user_number_claims')
        .delete()
        .gte('claimed_at', lastMonthStart)
        .lt('claimed_at', lastMonthEnd)

      if (claimsDeleteError) throw claimsDeleteError

      result.archived_claims = claimsToArchive.length
      console.log(`Archived ${result.archived_claims} number claims`)
    }

    // 3. 歸檔獎勵記錄
    console.log('Archiving bingo rewards...')
    const { data: rewardsToArchive, error: rewardsSelectError } = await supabaseClient
      .from('bingo_rewards')
      .select('*')
      .gte('claimed_at', lastMonthStart)
      .lt('claimed_at', lastMonthEnd)

    if (rewardsSelectError) throw rewardsSelectError

    if (rewardsToArchive && rewardsToArchive.length > 0) {
      const rewardsWithArchiveDate = rewardsToArchive.map(reward => ({
        ...reward,
        archived_at: new Date().toISOString()
      }))

      const { error: rewardsInsertError } = await supabaseClient
        .from('bingo_rewards_history')
        .insert(rewardsWithArchiveDate)

      if (rewardsInsertError) throw rewardsInsertError

      const { error: rewardsDeleteError } = await supabaseClient
        .from('bingo_rewards')
        .delete()
        .gte('claimed_at', lastMonthStart)
        .lt('claimed_at', lastMonthEnd)

      if (rewardsDeleteError) throw rewardsDeleteError

      result.archived_rewards = rewardsToArchive.length
      console.log(`Archived ${result.archived_rewards} bingo rewards`)
    }

    // 4. 歸檔每日號碼
    console.log('Archiving daily numbers...')
    const { data: numbersToArchive, error: numbersSelectError } = await supabaseClient
      .from('daily_bingo_numbers')
      .select('*')
      .gte('date', lastMonthStart)
      .lt('date', lastMonthEnd)

    if (numbersSelectError) throw numbersSelectError

    if (numbersToArchive && numbersToArchive.length > 0) {
      const numbersWithArchiveDate = numbersToArchive.map(number => ({
        ...number,
        archived_at: new Date().toISOString()
      }))

      const { error: numbersInsertError } = await supabaseClient
        .from('daily_bingo_numbers_history')
        .insert(numbersWithArchiveDate)

      if (numbersInsertError) throw numbersInsertError

      const { error: numbersDeleteError } = await supabaseClient
        .from('daily_bingo_numbers')
        .delete()
        .gte('date', lastMonthStart)
        .lt('date', lastMonthEnd)

      if (numbersDeleteError) throw numbersDeleteError

      result.archived_numbers = numbersToArchive.length
      console.log(`Archived ${result.archived_numbers} daily numbers`)
    }

    result.cleared_records =
      result.archived_cards +
      result.archived_claims +
      result.archived_rewards +
      result.archived_numbers

    // 5. 建立下月分區 (嘗試，可能因權限失敗)
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1)
    const nextMonthStart = nextMonth.toISOString().slice(0, 10)
    const nextMonthEnd = new Date(now.getFullYear(), now.getMonth() + 2, 1).toISOString().slice(0, 10)
    const partitionName = `user_bingo_cards_${nextMonth.getFullYear()}_${String(nextMonth.getMonth() + 1).padStart(2, '0')}`

    try {
      console.log(`Attempting to create partition: ${partitionName}`)

      const { error: partitionError } = await supabaseClient.rpc('create_monthly_partition', {
        table_name: 'user_bingo_cards',
        partition_name: partitionName,
        start_date: nextMonthStart,
        end_date: nextMonthEnd
      })

      if (partitionError) {
        console.warn(`Partition creation failed (expected if RPC doesn't exist): ${partitionError.message}`)
        result.partition_created = false
      } else {
        result.partition_created = true
        console.log(`Partition ${partitionName} created successfully`)
      }
    } catch (partitionErr) {
      console.warn(`Partition creation skipped: ${partitionErr}`)
      result.partition_created = false
    }

    // 6. 記錄重置執行日誌
    console.log('Logging reset execution...')
    const { error: logError } = await supabaseClient
      .from('monthly_reset_logs')
      .insert({
        reset_date: result.reset_date,
        archived_cards: result.archived_cards,
        archived_claims: result.archived_claims,
        archived_rewards: result.archived_rewards,
        archived_numbers: result.archived_numbers,
        cleared_records: result.cleared_records,
        partition_created: result.partition_created,
        executed_at: new Date().toISOString(),
        status: 'success'
      })

    if (logError) {
      console.error(`Failed to log reset execution: ${logError.message}`)
      // 不中斷執行，只記錄錯誤
    }

    console.log(`Monthly reset completed successfully:`, result)

    return new Response(
      JSON.stringify(result),
      {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      }
    )

  } catch (error) {
    console.error('Error during monthly reset:', error)

    // 記錄失敗日誌
    try {
      const supabaseClient = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      )

      await supabaseClient
        .from('monthly_reset_logs')
        .insert({
          reset_date: new Date(new Date().getTime() + 8 * 60 * 60 * 1000).toISOString().slice(0, 10),
          status: 'failed',
          error_message: error.message || 'Unknown error',
          executed_at: new Date().toISOString()
        })
    } catch (logErr) {
      console.error('Failed to log error:', logErr)
    }

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Unknown error occurred'
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      }
    )
  }
})
