// authenticate-toss-user.js
// Toss AppinToss userKey로 사용자 인증/생성

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = Deno.env.get('SUPABASE_URL');
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

const supabase = createClient(supabaseUrl, supabaseServiceKey);

Deno.serve(async (req) => {
  // CORS 처리
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  }

  try {
    const { userKey } = await req.json();

    if (!userKey) {
      return new Response(JSON.stringify({ error: 'userKey가 필요함' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 사용자 조회
    let { data: user, error: userError } = await supabase
      .from('users')
      .select('id, user_id')
      .eq('user_id', userKey)
      .single();

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
        .single();

      if (createError) {
        console.error('사용자 생성 오류:', createError);
        return new Response(
          JSON.stringify({ error: '사용자 생성 실패' }),
          { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
      }

      user = newUser;
    }

    // 간단한 JWT 토큰 생성 (테스트용)
    // 실제 운영에서는 Supabase의 내장 JWT 토큰 사용
    const token = btoa(JSON.stringify({
      sub: user.id,
      user_id: userKey,
      iat: Math.floor(Date.now() / 1000),
    }));

    return new Response(
      JSON.stringify({
        user_id: user.id,
        toss_user_key: userKey,
        token,
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  } catch (error) {
    console.error('인증 오류:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  }
});
