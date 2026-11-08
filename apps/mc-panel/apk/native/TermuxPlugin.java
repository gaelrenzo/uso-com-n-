package cl.ucn.mcpanel;

import android.content.Intent;
import android.content.pm.PackageManager;
import android.os.Build;
import com.getcapacitor.JSObject;
import com.getcapacitor.PermissionState;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;

// Puente con Termux: ejecuta comandos con el intent RUN_COMMAND (requiere allow-external-apps = true en Termux)
@CapacitorPlugin(
    name = "Termux",
    permissions = { @Permission(alias = "termux", strings = { "com.termux.permission.RUN_COMMAND" }) }
)
public class TermuxPlugin extends Plugin {
    private static final String TERMUX = "com.termux";

    private boolean instalado() {
        try {
            getContext().getPackageManager().getPackageInfo(TERMUX, 0);
            return true;
        } catch (PackageManager.NameNotFoundException e) {
            return false;
        }
    }

    @PluginMethod
    public void estado(PluginCall call) {
        JSObject r = new JSObject();
        r.put("instalado", instalado());
        r.put("permiso", getPermissionState("termux") == PermissionState.GRANTED);
        call.resolve(r);
    }

    @PluginMethod
    public void pedirPermiso(PluginCall call) {
        if (getPermissionState("termux") == PermissionState.GRANTED) {
            estado(call);
        } else {
            requestPermissionForAlias("termux", call, "permisoRespondido");
        }
    }

    @PermissionCallback
    private void permisoRespondido(PluginCall call) {
        estado(call);
    }

    @PluginMethod
    public void ejecutar(PluginCall call) {
        String script = call.getString("script");
        if (script == null || script.isEmpty()) {
            call.reject("falta el script");
            return;
        }
        Intent i = new Intent("com.termux.RUN_COMMAND");
        i.setClassName(TERMUX, "com.termux.app.RunCommandService");
        i.putExtra("com.termux.RUN_COMMAND_PATH", "/data/data/com.termux/files/usr/bin/bash");
        i.putExtra("com.termux.RUN_COMMAND_ARGUMENTS", new String[] { "-c", script });
        i.putExtra("com.termux.RUN_COMMAND_WORKDIR", "/data/data/com.termux/files/home");
        // En primer plano Termux abre una sesión visible (para ver el progreso de la instalación)
        i.putExtra("com.termux.RUN_COMMAND_BACKGROUND", call.getBoolean("segundoPlano", true));
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                getContext().startForegroundService(i);
            } else {
                getContext().startService(i);
            }
            call.resolve();
        } catch (Exception e) {
            call.reject(e.getMessage());
        }
    }

    @PluginMethod
    public void abrirTermux(PluginCall call) {
        Intent i = getContext().getPackageManager().getLaunchIntentForPackage(TERMUX);
        if (i == null) {
            call.reject("Termux no está instalado");
            return;
        }
        getActivity().startActivity(i);
        call.resolve();
    }
}
