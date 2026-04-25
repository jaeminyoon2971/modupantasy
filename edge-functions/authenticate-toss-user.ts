// Toss AppinToss userKey 기반 사용자 인증/생성
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': 'https://modupantasy.vercel.app',
  'Access-Control-Allow-Methods': 'POST',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

// userKey 유효성 검증 (32~128자 영숫자/특수문자)
function isValidUserKey(key: string): boolean {
  return typeof key === 'string' && key.length >= 8 && key.length <= 128
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS })
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405, headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
    })
  }

  try {
    const body = await req.json()
    const { userKey } = body

    if (!userKey || !isValidUserKey(userKey)) {
      return new Response(JSON.stringify({ error: 'userKey가 유효하지 않음' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
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
        console.error('사용자 생성 오류 코드:', createError.code)
        return new Response(
          JSON.stringify({ error: '사용자 생성 실패' }),
          { status: 500, headers: { 'Content-Type': 'application/json', ...CORS_HEADERS } }
        )
      }

      user = newUser
    }

    return new Response(
      JSON.stringify({ user_id: user.id }),
      { status: 200, headers: { 'Content-Type': 'application/json', ...CORS_HEADERS } }
    )
  } catch (error) {
    console.error('인증 오류 발생')
    return new Response(
      JSON.stringify({ error: '서버 오류가 발생했어요' }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...CORS_HEADERS } }
    )
  }
})
