// 프로젝트 전체 설정 저장 (작가설정, 세계관, 등장인물, 기획 등)
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

    // 사용자 확인
    const { data: user, error: userError } = await supabase
      .from('users').select('id').eq('user_id', userKey).single()
    if (userError || !user) {
      return new Response(JSON.stringify({ error: '사용자를 찾을 수 없음' }), {
        status: 401, headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
      })
    }

    const body = await req.json()
    const { project_id, settings } = body

    if (!project_id || typeof project_id !== 'string') {
      return new Response(JSON.stringify({ error: 'project_id가 필요함' }), {
        status: 400, headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
      })
    }
    if (!settings || typeof settings !== 'object') {
      return new Response(JSON.stringify({ error: 'settings가 필요함' }), {
        status: 400, headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
      })
    }

    // 프로젝트 소유권 확인
    const { data: project, error: projError } = await supabase
      .from('projects').select('id').eq('id', project_id).eq('user_id', user.id).single()
    if (projError || !project) {
      return new Response(JSON.stringify({ error: '프로젝트를 찾을 수 없음' }), {
        status: 404, headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
      })
    }

    // manuscript는 episodes 테이블에 별도 저장되므로 settings에서 제외
    const safeSettings = { ...settings }
    if (safeSettings.episodes) {
      safeSettings.episodes = (safeSettings.episodes as any[]).map((ep: any) => {
        const { manuscript, ...rest } = ep
        return rest
      })
    }

    // settings 저장
    const { error: updateError } = await supabase
      .from('projects')
      .update({
        settings: safeSettings,
        title: settings.projectTitle || '',
        updated_at: new Date().toISOString(),
      })
      .eq('id', project_id)
      .eq('user_id', user.id)

    if (updateError) {
      console.error('settings 저장 오류 코드:', updateError.code)
      return new Response(JSON.stringify({ error: '저장 실패' }), {
        status: 500, headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
      })
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200, headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
    })
  } catch (error) {
    console.error('오류 발생')
    return new Response(JSON.stringify({ error: '서버 오류가 발생했어요' }), {
      status: 500, headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
    })
  }
})
