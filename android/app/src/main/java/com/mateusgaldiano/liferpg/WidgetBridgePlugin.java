package com.mateusgaldiano.liferpg;

import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/**
 * Plugin Capacitor mínimo: expõe ao JS um jeito de forçar a atualização do App
 * Widget na hora (quando o gameState muda). Do JS:
 *   window.Capacitor.Plugins.WidgetBridge.refresh()
 *
 * Os dados em si vão pelo @capacitor/preferences (SharedPreferences "CapacitorStorage",
 * chave widget_stats); este plugin só pede ao AppWidgetManager pra re-renderizar.
 */
@CapacitorPlugin(name = "WidgetBridge")
public class WidgetBridgePlugin extends Plugin {

    @PluginMethod
    public void refresh(PluginCall call) {
        LifeRPGWidget.updateAll(getContext());
        call.resolve();
    }
}
