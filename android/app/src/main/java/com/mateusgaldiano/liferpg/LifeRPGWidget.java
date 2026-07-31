package com.mateusgaldiano.liferpg;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.widget.RemoteViews;

import org.json.JSONObject;

/**
 * App Widget de tela inicial do LifeRPG — v1.
 *
 * Mostra, no visual do app:
 *   • ATIVIDADES: feitas / total do dia (barra ciano).
 *   • MASMORRA: masmorra ativa (título, progresso/alvo, tempo restante) — barra
 *     dourada; ou "Nenhuma masmorra ativa".
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

    @Override
    public void onUpdate(Context context, AppWidgetManager manager, int[] widgetIds) {
        for (int id : widgetIds) {
            updateWidget(context, manager, id);
        }
    }

    /** Reconstrói e empurra o RemoteViews de um widget específico. */
    static void updateWidget(Context context, AppWidgetManager manager, int widgetId) {
        RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.widget_liferpg);

        // ── Placeholders (Etapa 3) — sobrescritos pelos dados reais se existirem ──
        int activitiesDone = 10;
        int activitiesTotal = 20;
        String dungeonTitle = "Templo Mental";
        int dungeonProgress = 2;
        int dungeonTarget = 3;
        long dungeonExpiresAt = System.currentTimeMillis() + 14L * 3600_000L;

        try {
            SharedPreferences sp = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
            String raw = sp.getString(KEY, null);
            if (raw != null && !raw.isEmpty()) {
                JSONObject o = new JSONObject(raw);
                activitiesDone = o.optInt("activitiesDone", activitiesDone);
                activitiesTotal = o.optInt("activitiesTotal", activitiesTotal);
                // dungeonTitle vazio/ausente = nenhuma masmorra ativa.
                dungeonTitle = o.optString("dungeonTitle", "");
                dungeonProgress = o.optInt("dungeonProgress", 0);
                dungeonTarget = o.optInt("dungeonTarget", 0);
                dungeonExpiresAt = o.optLong("dungeonExpiresAt", 0L);
            }
        } catch (Exception ignored) {
            // JSON malformado / prefs ausentes → mantém placeholder.
        }

        // ── ATIVIDADES ──────────────────────────────────────────────
        views.setTextViewText(R.id.widget_act_value, activitiesDone + " / " + activitiesTotal);
        views.setProgressBar(R.id.widget_act_bar, 100, pct(activitiesDone, activitiesTotal), false);

        // ── MASMORRA ────────────────────────────────────────────────
        if (dungeonTitle == null || dungeonTitle.isEmpty()) {
            views.setTextViewText(R.id.widget_dungeon_title, "Nenhuma masmorra ativa");
            views.setTextViewText(R.id.widget_dungeon_value, "");
            views.setTextViewText(R.id.widget_dungeon_time, "");
            views.setProgressBar(R.id.widget_dungeon_bar, 100, 0, false);
        } else {
            views.setTextViewText(R.id.widget_dungeon_title, "🗝 " + dungeonTitle); // 🗝
            views.setTextViewText(R.id.widget_dungeon_value, dungeonProgress + " / " + dungeonTarget);
            views.setProgressBar(R.id.widget_dungeon_bar, 100, pct(dungeonProgress, dungeonTarget), false);
            views.setTextViewText(R.id.widget_dungeon_time, timeLeft(dungeonExpiresAt));
        }

        // Toque no widget abre o app.
        Intent launch = context.getPackageManager().getLaunchIntentForPackage(context.getPackageName());
        if (launch != null) {
            PendingIntent pi = PendingIntent.getActivity(
                    context, 0, launch,
                    PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
            views.setOnClickPendingIntent(R.id.widget_root, pi);
        }

        manager.updateAppWidget(widgetId, views);
    }

    /** Percentual inteiro (0–100) de done/total, à prova de divisão por zero. */
    private static int pct(int done, int total) {
        if (total <= 0) return 0;
        int p = Math.round(done * 100f / total);
        if (p < 0) return 0;
        if (p > 100) return 100;
        return p;
    }

    /** Tempo restante da masmorra em horas (arredonda pra cima), ou "expirada". */
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
