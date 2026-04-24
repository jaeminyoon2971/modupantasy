// Toss AppinToss userKey 기반 사용자 인증/생성
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

function extractUserKey(req: Request): string | null {
  const authHeader = req.headers.get('authorization') || ''
  const parts = authHeader.split(' ')
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return null
  }
  return parts[1]
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    })
  }

  try {
    const { userKey } = await req.json()

    if (!userKey) {
      return new Response(JSON.stringify({ error: 'userKey가 필요함' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // 사용자 조회
    let { data: user, error: userError } = await supabase
      .from('users')
      .select('id, user_id')
      .eq('user_id', userKey)
      .single()

    // 사용자가 없으면 생성
    if (userError || !user) {
      const { data: newUser, error: createError } = await supabase
        .from('users')
        .insert({
          user_id: userKey,
          username: `User_${userKey.slice(0, 8)}`,
          created_at: new Date().toISOString(),
        })
        .select()
        .single()

      if (createError) {
        console.error('사용자 생성 오류:', createError)
        return new Response(
          JSON.stringify({ error: '사용자 생성 실패' }),
          { status: 500, headers: { 'Content-Type': 'application/json' } }
        )
      }

      user = newUser
    }

    return new Response(
      JSON.stringify({
        user_id: user.id,
        toss_user_key: userKey,
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    )
  } catch (error) {
    console.error('인증 오류:', error)
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : '오류 발생' }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    )
  }
})
