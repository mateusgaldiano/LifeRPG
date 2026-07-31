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
 * App Widget de tela inicial do LifeRPG.
 *
 * Mostra nível + rank, barra de XP, streak e missões restantes no visual do app.
 * Lê o objeto {@code widget_stats} do SharedPreferences onde o plugin
 * @capacitor/preferences grava (grupo padrão "CapacitorStorage"). Enquanto a app
 * ainda não gravou nada (Etapa 3), cai nos valores placeholder — o que já valida
 * o layout. A Etapa 4 liga a ponte de dados de verdade.
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

        // Placeholder (Etapa 3) — sobrescrito pelos dados reais se existirem.
        int level = 12;
        String rank = "C";
        int xp = 780;
        int xpToNext = 1300;
        int streak = 7;
        int questsRemaining = 3;

        try {
            SharedPreferences sp = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
            String raw = sp.getString(KEY, null);
            if (raw != null && !raw.isEmpty()) {
                JSONObject o = new JSONObject(raw);
                level = o.optInt("level", level);
                rank = o.optString("rank", rank);
                xp = o.optInt("xp", xp);
                xpToNext = o.optInt("xpToNext", xpToNext);
                streak = o.optInt("streak", streak);
                questsRemaining = o.optInt("questsRemaining", questsRemaining);
            }
        } catch (Exception ignored) {
            // JSON malformado / prefs ausentes → mantém placeholder.
        }

        int pct = xpToNext > 0 ? Math.round(xp * 100f / xpToNext) : 0;
        if (pct < 0) pct = 0;
        if (pct > 100) pct = 100;

        views.setTextViewText(R.id.widget_level, "LV " + level);
        views.setTextViewText(R.id.widget_rank, rank);
        views.setProgressBar(R.id.widget_xp_bar, 100, pct, false);
        views.setTextViewText(R.id.widget_xp_text, xp + " / " + xpToNext + " XP");
        views.setTextViewText(R.id.widget_streak, "🔥 " + streak);
        views.setTextViewText(R.id.widget_quests,
                questsRemaining <= 0
                        ? "✓ tudo feito"
                        : ("⚔ " + questsRemaining + (questsRemaining == 1 ? " missao" : " missoes")));

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
