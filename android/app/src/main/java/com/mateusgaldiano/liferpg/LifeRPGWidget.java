package com.mateusgaldiano.liferpg;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Build;
import android.util.SizeF;
import android.widget.RemoteViews;

import org.json.JSONObject;

import java.util.HashMap;
import java.util.Map;

/**
 * App Widget de tela inicial do LifeRPG — v1.
 *
 * Mostra, no visual do app:
 *   • ATIVIDADES: feitas / total do dia (barra ciano).
 *   • MASMORRA: masmorra ativa (título, progresso/alvo, tempo restante) — barra
 *     dourada; ou "Nenhuma masmorra ativa".
 *
 * RESPONSIVO de 1x1 a 4x4: em API 31+ fornece três layouts (small/medium/large)
 * num mapa SizeF→RemoteViews e o sistema escolhe o melhor conforme o tamanho.
 * Em versões antigas, cai no layout médio.
 *
 * Lê o objeto {@code widget_stats} do SharedPreferences onde o plugin
 * @capacitor/preferences grava (grupo padrão "CapacitorStorage"). Enquanto a app
 * ainda não gravou nada (Etapa 3), cai nos placeholders — o que já valida o
 * layout. A Etapa 4 liga a ponte de dados de verdade.
 */
public class LifeRPGWidget extends AppWidgetProvider {

    // SharedPreferences padrão do @capacitor/preferences (sem "group").
    private static final String PREFS = "CapacitorStorage";
    private static final String KEY = "widget_stats";

    /** Dados exibidos no widget (placeholder ou lidos de widget_stats). */
    private static final class Stats {
        int actDone = 10;
        int actTotal = 20;
        String dungeonTitle = "Templo Mental";
        int dungeonProgress = 2;
        int dungeonTarget = 3;
        long dungeonExpiresAt = System.currentTimeMillis() + 14L * 3600_000L;
    }

    @Override
    public void onUpdate(Context context, AppWidgetManager manager, int[] widgetIds) {
        for (int id : widgetIds) {
            updateWidget(context, manager, id);
        }
    }

    /** Reconstrói e empurra o(s) RemoteViews de um widget específico. */
    static void updateWidget(Context context, AppWidgetManager manager, int widgetId) {
        Stats s = readStats(context);

        Intent launch = context.getPackageManager().getLaunchIntentForPackage(context.getPackageName());
        PendingIntent openPi = (launch == null) ? null : PendingIntent.getActivity(
                context, 0, launch,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);

        RemoteViews result;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            // Mapa tamanho→layout: o launcher escolhe o maior que couber.
            Map<SizeF, RemoteViews> map = new HashMap<>();
            map.put(new SizeF(40f, 40f), buildFor(context, R.layout.widget_liferpg_small, s, openPi));
            map.put(new SizeF(120f, 120f), buildFor(context, R.layout.widget_liferpg_medium, s, openPi));
            map.put(new SizeF(200f, 140f), buildFor(context, R.layout.widget_liferpg, s, openPi));
            result = new RemoteViews(map);
        } else {
            result = buildFor(context, R.layout.widget_liferpg_medium, s, openPi);
        }

        manager.updateAppWidget(widgetId, result);
    }

    /** Monta um RemoteViews para um layout específico, setando só os ids que ele tem. */
    private static RemoteViews buildFor(Context ctx, int layout, Stats s, PendingIntent openPi) {
        RemoteViews v = new RemoteViews(ctx.getPackageName(), layout);
        boolean hasDungeon = s.dungeonTitle != null && !s.dungeonTitle.isEmpty();

        // Atividades — o valor existe em todos os layouts.
        v.setTextViewText(R.id.widget_act_value, s.actDone + " / " + s.actTotal);

        if (layout == R.layout.widget_liferpg_small) {
            // Pequeno: só o valor de atividades.
        } else if (layout == R.layout.widget_liferpg_medium) {
            v.setProgressBar(R.id.widget_act_bar, 100, pct(s.actDone, s.actTotal), false);
            if (hasDungeon) {
                v.setTextViewText(R.id.widget_dungeon_value, s.dungeonProgress + " / " + s.dungeonTarget);
                v.setTextViewText(R.id.widget_dungeon_time, timeLeft(s.dungeonExpiresAt));
            } else {
                v.setTextViewText(R.id.widget_dungeon_value, "—");
                v.setTextViewText(R.id.widget_dungeon_time, "");
            }
        } else { // grande (R.layout.widget_liferpg)
            v.setProgressBar(R.id.widget_act_bar, 100, pct(s.actDone, s.actTotal), false);
            if (hasDungeon) {
                v.setTextViewText(R.id.widget_dungeon_title, "🗝 " + s.dungeonTitle);
                v.setTextViewText(R.id.widget_dungeon_value, s.dungeonProgress + " / " + s.dungeonTarget);
                v.setProgressBar(R.id.widget_dungeon_bar, 100, pct(s.dungeonProgress, s.dungeonTarget), false);
                v.setTextViewText(R.id.widget_dungeon_time, timeLeft(s.dungeonExpiresAt));
            } else {
                v.setTextViewText(R.id.widget_dungeon_title, "Nenhuma masmorra ativa");
                v.setTextViewText(R.id.widget_dungeon_value, "");
                v.setProgressBar(R.id.widget_dungeon_bar, 100, 0, false);
                v.setTextViewText(R.id.widget_dungeon_time, "");
            }
        }

        if (openPi != null) {
            v.setOnClickPendingIntent(R.id.widget_root, openPi);
        }
        return v;
    }

    /** Lê widget_stats do SharedPreferences; mantém placeholders no que faltar. */
    private static Stats readStats(Context context) {
        Stats s = new Stats();
        try {
            SharedPreferences sp = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
            String raw = sp.getString(KEY, null);
            if (raw != null && !raw.isEmpty()) {
                JSONObject o = new JSONObject(raw);
                s.actDone = o.optInt("activitiesDone", s.actDone);
                s.actTotal = o.optInt("activitiesTotal", s.actTotal);
                // dungeonTitle vazio/ausente = nenhuma masmorra ativa.
                s.dungeonTitle = o.optString("dungeonTitle", "");
                s.dungeonProgress = o.optInt("dungeonProgress", 0);
                s.dungeonTarget = o.optInt("dungeonTarget", 0);
                s.dungeonExpiresAt = o.optLong("dungeonExpiresAt", 0L);
            }
        } catch (Exception ignored) {
            // JSON malformado / prefs ausentes → mantém placeholder.
        }
        return s;
    }

    /** Percentual inteiro (0–100) de done/total, à prova de divisão por zero. */
    private static int pct(int done, int total) {
        if (total <= 0) return 0;
        int p = Math.round(done * 100f / total);
        if (p < 0) return 0;
        if (p > 100) return 100;
        return p;
    }

    /** Tempo restante da masmorra (arredonda pra cima), ou "expirada". */
    private static String timeLeft(long expiresAt) {
        if (expiresAt <= 0) return "";
        long ms = expiresAt - System.currentTimeMillis();
        if (ms <= 0) return "expirada";
        long hours = (ms + 3599_999L) / 3600_000L;
        if (hours >= 48) return "⏳ " + (hours / 24) + "d";
        return "⏳ " + hours + "h";
    }

    /**
     * Atualiza TODOS os widgets do LifeRPG na home. Chamado pela app (via plugin
     * mínimo) sempre que o gameState muda — ligado na Etapa 4.
     */
    static void updateAll(Context context) {
        AppWidgetManager manager = AppWidgetManager.getInstance(context);
        ComponentName component = new ComponentName(context, LifeRPGWidget.class);
        int[] ids = manager.getAppWidgetIds(component);
        for (int id : ids) {
            updateWidget(context, manager, id);
        }
    }
}
