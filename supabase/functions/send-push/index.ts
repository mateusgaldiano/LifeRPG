import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.21.0"
import webpush from "npm:web-push"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // CORS Preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY');
    // Fonte única: o público vem do env (bate com o secret e com o pwa.js).
    // Fallback = chave pública nova (mesma do pwa.js) caso o secret não seja setado.
    const vapidPublicKey = Deno.env.get('VAPID_PUBLIC_KEY')
      ?? 'BNzkAwPWHVgwr-EvHrliAwhleRc_Z7ArYuxJpAgy_2rMSkMbEQXNIMTpoex1SZWKol7ZgrzE2Iyt9Io9rXXTFU0';

    if (!vapidPrivateKey) {
      throw new Error('Chave secreta VAPID_PRIVATE_KEY não está configurada nos Secrets do Supabase.');
    }

    // Configura os detalhes do servidor VAPID
    webpush.setVapidDetails(
      'mailto:mateusgaldiano@gmail.com',
      vapidPublicKey,
      vapidPrivateKey
    );

    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);
    const body = await req.json();
    const { action } = body;

    // AÇÃO 1: Disparo automatizado global (pg_cron)
    if (action === 'trigger_all_reminders') {
      console.log('[Push] Iniciando disparo em lote de lembretes diários...');

      // Seleciona todas as quests pendentes
      const { data: pendingQuests, error: errorQuests } = await supabase
        .from('quests')
        .select('user_id')
        .eq('completed', false);

      if (errorQuests) {
        throw new Error('Falha ao buscar quests pendentes: ' + errorQuests.message);
      }

      if (!pendingQuests || pendingQuests.length === 0) {
        return new Response(JSON.stringify({ message: 'Nenhuma quest pendente no sistema.' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200
        });
      }

      // Agrupa a contagem de quests por user_id
      const pendingMap: Record<string, number> = {};
      pendingQuests.forEach((q) => {
        pendingMap[q.user_id] = (pendingMap[q.user_id] || 0) + 1;
      });

      const userIds = Object.keys(pendingMap);
      console.log(`[Push] Encontrados ${userIds.length} usuários com pendências.`);

      let sentCount = 0;

      // Para cada usuário, busca as inscrições de push e envia a notificação
      for (const userId of userIds) {
        const count = pendingMap[userId];
        const title = '⚠️ OFFENSIVE EM RISCO!';
        const bodyText = `Ainda restam ${count} missões diárias pendentes. Complete-as antes da meia-noite para manter o seu streak!`;
        const tag = 'streak-alert';

        const success = await sendPushToUser(supabase, userId, title, bodyText, tag);
        if (success) sentCount++;
      }

      return new Response(JSON.stringify({ message: `Disparos concluídos. ${sentCount} usuários notificados.` }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      });
    }

    // AÇÃO 1b: Disparo por HORÁRIO (pg_cron a cada 15 min).
    // Dispara pra quem tem morning/evening_utc_min caindo no bucket de 15 min atual.
    if (action === 'trigger_scheduled') {
      const now = new Date();
      const nowMin = now.getUTCHours() * 60 + now.getUTCMinutes();
      const bucket = Math.floor(nowMin / 15);

      const { data: prefs, error: prefsErr } = await supabase
        .from('user_notif_prefs')
        .select('user_id, morning_utc_min, evening_utc_min')
        .eq('enabled', true);

      if (prefsErr) throw new Error('Falha ao buscar prefs: ' + prefsErr.message);

      const MSG = {
        morning: { title: '⚔️ GET UP! O Sistema chama.', body: 'Suas missões diárias estão esperando. Comece o dia no controle.', tag: 'morning-reminder' },
        evening: { title: '🔥 Não quebre seu streak!',    body: 'Ainda dá tempo de concluir suas missões de hoje. O Sistema está de olho.', tag: 'evening-reminder' },
      };

      let sent = 0;
      for (const p of (prefs ?? [])) {
        let period: 'morning' | 'evening' | null = null;
        if (p.morning_utc_min != null && Math.floor(p.morning_utc_min / 15) === bucket) period = 'morning';
        else if (p.evening_utc_min != null && Math.floor(p.evening_utc_min / 15) === bucket) period = 'evening';
        if (!period) continue;
        const m = MSG[period];
        const ok = await sendPushToUser(supabase, p.user_id, m.title, m.body, m.tag);
        if (ok) sent++;
      }

      return new Response(JSON.stringify({ bucket, checked: prefs?.length ?? 0, sent }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      });
    }

    // AÇÃO 2: Disparo individual de notificação push
    const { user_id, title, body: bodyText, tag } = body;
    if (!user_id || !title || !bodyText) {
      return new Response(JSON.stringify({ error: 'Parâmetros ausentes (user_id, title, body).' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      });
    }

    const success = await sendPushToUser(supabase, user_id, title, bodyText, tag || 'general-push');

    if (success) {
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      });
    } else {
      return new Response(JSON.stringify({ error: 'Não foi possível entregar a notificação (nenhum endpoint ativo).' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 404
      });
    }

  } catch (err: any) {
    console.error('[Push Error]', err);
    return new Response(JSON.stringify({ error: err.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    });
  }
});

/**
 * Envia notificação push para todos os endpoints cadastrados de um usuário.
 * Retorna true se pelo menos um push foi disparado com sucesso (ou se nenhuma falha definitiva ocorreu).
 */
async function sendPushToUser(
  supabase: any,
  userId: string,
  title: string,
  body: string,
  tag: string
): Promise<boolean> {
  // Busca todas as inscrições do usuário no banco
  const { data: subs, error } = await supabase
    .from('push_subscriptions')
    .select('id, endpoint, p256dh, auth')
    .eq('user_id', userId);

  if (error) {
    console.error(`[Push] Erro ao buscar sub para ${userId}:`, error.message);
    return false;
  }

  if (!subs || subs.length === 0) {
    console.log(`[Push] Usuário ${userId} não possui inscrições de push cadastradas.`);
    return false;
  }

  console.log(`[Push] Usuário ${userId} possui ${subs.length} endpoints ativos. Disparando concorrentemente...`);

  // Dispara notificações em paralelo para todos os endpoints do usuário (multi-device)
  const promises = subs.map(async (sub: any) => {
    const subscription = {
      endpoint: sub.endpoint,
      keys: {
        p256dh: sub.p256dh,
        auth: sub.auth
      }
    };

    try {
      await webpush.sendNotification(subscription, JSON.stringify({ title, body, tag }));
      console.log(`[Push] Sucesso ao enviar para endpoint: ${sub.endpoint.substring(0, 40)}...`);
      return true;
    } catch (pushErr: any) {
      console.error(`[Push] Erro ao enviar para ${sub.id}:`, pushErr.message, pushErr.statusCode);
      
      // Se o serviço de push do navegador retornar 410 (Gone) ou 404 (Not Found),
      // a inscrição é inválida ou expirou definitivamente. Devemos removê-la para economizar recursos.
      if (pushErr.statusCode === 410 || pushErr.statusCode === 404) {
        console.log(`[Push] Limpando inscrição expirada/inválida ID: ${sub.id}`);
        await supabase.from('push_subscriptions').delete().eq('id', sub.id);
      }
      return false;
    }
  });

  const results = await Promise.all(promises);
  return results.some(res => res === true);
}
