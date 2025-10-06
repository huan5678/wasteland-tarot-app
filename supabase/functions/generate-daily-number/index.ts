/**
 * Supabase Edge Function: 每日賓果號碼生成
 *
 * 排程: 每日 16:00 UTC (00:00 UTC+8 隔天)
 * 觸發: pg_cron 或手動 HTTP 請求
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

interface DailyNumber {
  date: string
  number: number
  cycle_number: number
  generated_at: string
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

    // 取得台北時區當前日期 (UTC+8)
    const taipeiDate = new Date(new Date().getTime() + 8 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 10)

    console.log(`Generating daily number for date: ${taipeiDate}`)

    // 1. 檢查今日是否已生成號碼
    const { data: existing, error: checkError } = await supabaseClient
      .from('daily_bingo_numbers')
      .select('*')
      .eq('date', taipeiDate)
      .single()

    if (checkError && checkError.code !== 'PGRST116') {
      throw checkError
    }

    if (existing) {
      console.log(`Number already exists for ${taipeiDate}: ${existing.number}`)
      return new Response(
        JSON.stringify({
          success: true,
          already_exists: true,
          number: existing.number,
          date: taipeiDate
        }),
        { headers: { 'Content-Type': 'application/json' } }
      )
    }

    // 2. 取得本月已生成號碼（當前循環）
    const currentMonth = taipeiDate.slice(0, 7) + '-01'

    const { data: monthNumbers, error: monthError } = await supabaseClient
      .from('daily_bingo_numbers')
      .select('number, cycle_number')
      .gte('date', currentMonth)
      .order('cycle_number', { ascending: false })
      .order('date', { ascending: false })

    if (monthError) throw monthError

    // 3. 計算當前循環編號與已使用號碼
    let currentCycle = 1
    const usedNumbers = new Set<number>()

    if (monthNumbers && monthNumbers.length > 0) {
      currentCycle = monthNumbers[0].cycle_number

      // 取得當前循環的號碼
      for (const record of monthNumbers) {
        if (record.cycle_number === currentCycle) {
          usedNumbers.add(record.number)
        }
      }
    }

    // 4. 若當前循環已滿 25 個號碼，開始新循環
    if (usedNumbers.size >= 25) {
      console.log(`Cycle ${currentCycle} completed with 25 numbers, starting new cycle`)
      currentCycle += 1
      usedNumbers.clear()
    }

    // 5. 生成可用號碼（Fisher-Yates shuffle）
    const allNumbers = Array.from({ length: 25 }, (_, i) => i + 1)
    const availableNumbers = allNumbers.filter(n => !usedNumbers.has(n))

    if (availableNumbers.length === 0) {
      throw new Error('No available numbers (should not happen after cycle reset)')
    }

    // Fisher-Yates shuffle
    for (let i = availableNumbers.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [availableNumbers[i], availableNumbers[j]] = [availableNumbers[j], availableNumbers[i]]
    }

    const selectedNumber = availableNumbers[0]

    // 6. 插入資料庫
    const { data: newNumber, error: insertError } = await supabaseClient
      .from('daily_bingo_numbers')
      .insert({
        date: taipeiDate,
        number: selectedNumber,
        cycle_number: currentCycle,
        generated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (insertError) throw insertError

    console.log(
      `Generated number ${selectedNumber} for ${taipeiDate} ` +
      `(cycle: ${currentCycle}, used: ${usedNumbers.size + 1}/25)`
    )

    return new Response(
      JSON.stringify({
        success: true,
        number: selectedNumber,
        date: taipeiDate,
        cycle_number: currentCycle,
        used_count: usedNumbers.size + 1,
        available_count: 25 - usedNumbers.size - 1
      }),
      {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      }
    )

  } catch (error) {
    console.error('Error generating daily number:', error)

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
