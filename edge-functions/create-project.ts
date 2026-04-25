// Toss userKey 기반 프로젝트 생성
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': 'https://modupantasy.vercel.app',
  'Access-Control-Allow-Methods': 'POST',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

function extractUserKey(req: Request): string | null {
  const authHeader = req.headers.get('authorization') || ''
  const parts = authHeader.split(' ')
  if (parts.length !== 2 || parts[0] !== 'Bearer') return null
  const key = parts[1]
  if (key.length < 8 || key.length > 128) return null
  return key
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
    const userKey = extractUserKey(req)
    if (!userKey) {
      return new Response(JSON.stringify({ error: '인증 필요' }), {
        status: 401, headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
      })
    }

    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('user_id', userKey)
      .single()

    if (userError || !user) {
      return new Response(JSON.stringify({ error: '사용자를 찾을 수 없음' }), {
        status: 401, headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
      })
    }

    const body = await req.json()
    const title = typeof body.title === 'string' ? body.title.slice(0, 200) : ''
    const description = typeof body.description === 'string' ? body.description.slice(0, 1000) : ''
    const genre = typeof body.genre === 'string' ? body.genre.slice(0, 100) : ''

    if (!title.trim()) {
      return new Response(JSON.stringify({ error: '제목이 필요함' }), {
        status: 400, headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
      })
    }

    const { data: project, error: createError } = await supabase
      .from('projects')
      .insert({
        id: crypto.randomUUID(),
        user_id: user.id,
        title,
        description,
        genre,
        created_at: new Date().toISOString(),
      })
      .select()

    if (createError) {
      console.error('프로젝트 생성 오류 코드:', createError.code)
      return new Response(JSON.stringify({ error: '프로젝트 생성 실패' }), {
        status: 500, headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
      })
    }

    return new Response(JSON.stringify({ data: project }), {
      status: 200, headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
    })
  } catch (error) {
    console.error('오류 발생')
    return new Response(JSON.stringify({ error: '서버 오류가 발생했어요' }), {
      status: 500, headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
    })
  }
})
