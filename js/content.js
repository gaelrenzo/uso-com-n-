const workstationContent = {
  server: [
    {
      title: "1. Carpeta del proyecto HTML",
      description: "Aqui vive este proyecto. Edita index.html, css/style.css o los archivos dentro de js/.",
      commands: [
        "cd ~/workspace/uso-com-n-",
        "ls -la",
        "find . -maxdepth 3 -type f"
      ]
    },
    {
      title: "2. Encender el servidor",
      description: "live-server sirve la pagina y recarga el navegador cuando guardas cambios.",
      commands: [
        "cd ~/workspace/uso-com-n-",
        "live-server --host=127.0.0.1 --port=8080"
      ]
    },
    {
      title: "3. Conexion desde el navegador",
      description: "Abre esta direccion en Chrome Android, Firefox o el navegador del sistema.",
      commands: [
        "http://127.0.0.1:8080",
        "http://localhost:8080"
      ]
    },
    {
      title: "4. Verificar que responde",
      description: "Este comando confirma que el servidor esta entregando el HTML correctamente.",
      commands: [
        "curl -I http://127.0.0.1:8080"
      ]
    },
    {
      title: "5. Donde colocar o cambiar datos",
      description: "Usa el formulario de arriba para comandos personalizados. Para cambios permanentes, edita estos archivos.",
      commands: [
        "nano index.html        # estructura de secciones",
        "nano js/content.js     # textos, listas y comandos fijos",
        "nano js/app.js         # logica, formularios y botones copiar",
        "nano css/style.css     # diseño visual"
      ]
    },
    {
      title: "6. Servidor actual",
      description: "En esta sesion el servidor ya esta corriendo en 127.0.0.1:8080.",
      commands: [
        "Serving ~/workspace/uso-com-n- at http://127.0.0.1:8080",
        "Ready for changes"
      ]
    }
  ],
  tunnel: [
    {
      title: "Opcion 1: SSH con localhost.run",
      description: "La forma mas rapida de publicar temporalmente tu servidor local sin instalar nada extra. Usa SSH y te entrega una URL publica.",
      commands: [
        "ssh -R 80:localhost:8080 nokey@localhost.run"
      ]
    },
    {
      title: "Si tu app usa otro puerto",
      description: "Reemplaza 3000 por el puerto real de tu servidor local. Para este proyecto usamos 8080.",
      commands: [
        "ssh -R 80:localhost:3000 nokey@localhost.run",
        "ssh -R 80:localhost:8080 nokey@localhost.run"
      ]
    },
    {
      title: "Como usar la URL publica",
      description: "Al conectar, localhost.run mostrara una direccion HTTPS publica. Comparte esa URL para probar tu pagina desde otro dispositivo.",
      commands: [
        "Ejemplo de salida: https://tu-servidor.lhr.life",
        "Abre esa URL en cualquier navegador",
        "Manten la terminal abierta mientras uses el enlace"
      ]
    },
    {
      title: "Flujo recomendado",
      description: "Primero enciende live-server. Luego abre otra terminal o panel tmux para ejecutar el tunel SSH.",
      commands: [
        "cd ~/workspace/uso-com-n-",
        "live-server --host=127.0.0.1 --port=8080",
        "ssh -R 80:localhost:8080 nokey@localhost.run"
      ]
    }
  ],
  modules: [
    {
      title: "Android",
      description: "Sistema base donde corren Termux, almacenamiento, internet, bateria e interfaz movil.",
      items: ["Termux", "almacenamiento", "conexion internet", "bateria", "interfaz movil"]
    },
    {
      title: "Termux",
      description: "Terminal Linux para Android usada para instalar paquetes, manejar archivos y automatizar.",
      items: ["comandos Linux", "paquetes", "SSH", "scripts"],
      command: "pkg update && pkg upgrade"
    },
    {
      title: "Ubuntu proot",
      description: "Entorno Linux completo dentro de Android con compatibilidad para herramientas dev modernas.",
      items: ["NodeJS real", "npm real", "ARM64", "herramientas Linux"],
      command: "proot-distro login ubuntu"
    },
    {
      title: "NodeJS + npm",
      description: "Base para ejecutar herramientas modernas de JavaScript, agentes y servidores locales.",
      items: ["Node v22.22.2", "npm 10.9.7", "paquetes npm", "automatizaciones"],
      command: "node -v && npm -v"
    },
    {
      title: "Codex / OpenCode",
      description: "Agentes IA para programar, editar repositorios, analizar codigo y crear aplicaciones.",
      items: ["generar codigo", "editar proyectos", "analizar repos", "automatizar desarrollo"],
      command: "codex"
    },
    {
      title: "Workspace",
      description: "Carpeta principal donde viven proyectos, repositorios, scripts, apps y documentos.",
      items: ["~/workspace/uso-com-n-", "~/workspace", "repos GitHub", "documentos"],
      command: "cd ~/workspace/uso-com-n-"
    },
    {
      title: "Google Drive + rclone",
      description: "Sincronizacion entre Linux y Google Drive para backup y acceso desde otros dispositivos.",
      items: ["subir archivos", "respaldos", "sync automatico", "nube"],
      command: "rclone config"
    },
    {
      title: "Git + GitHub",
      description: "Control de versiones local y remoto para guardar historial, colaborar y publicar.",
      items: ["commits", "ramas", "push", "pull"],
      command: "git status"
    },
    {
      title: "tmux + wake-lock",
      description: "Persistencia terminal y proteccion contra suspension durante sesiones largas.",
      items: ["multiples terminales", "procesos persistentes", "multitarea", "sesiones largas"],
      command: "tmux"
    }
  ],
  workflow: [
    ["Abrir Termux", "termux-wake-lock"],
    ["Entrar a Ubuntu si vas a trabajar ahi", "proot-distro login ubuntu"],
    ["Abrir tmux", "tmux"],
    ["Ir al proyecto HTML", "cd ~/workspace/uso-com-n-"],
    ["Encender servidor", "live-server --host=127.0.0.1 --port=8080"],
    ["Abrir navegador", "http://127.0.0.1:8080"],
    ["Editar contenido modular", "nano js/content.js"],
    ["Versionar cambios", "git add . && git commit -m \"avance\" && git push"]
  ],
  github: [
    {
      title: "1. Configurar identidad Git",
      description: "Define el nombre y correo que apareceran en tus commits.",
      commands: [
        "git config --global user.name \"Tu Nombre\"",
        "git config --global user.email \"tu-correo@example.com\"",
        "git config --global init.defaultBranch main"
      ]
    },
    {
      title: "2. Crear llave SSH",
      description: "La llave SSH evita usar contrasena cada vez que haces push o pull.",
      commands: [
        "ssh-keygen -t ed25519 -C \"tu-correo@example.com\"",
        "cat ~/.ssh/id_ed25519.pub",
        "ssh -T git@github.com"
      ]
    },
    {
      title: "3. Subir proyecto nuevo",
      description: "Inicializa Git localmente y conecta el repo creado en GitHub.",
      commands: [
        "cd ~/workspace/uso-com-n-",
        "git init",
        "git add .",
        "git commit -m \"primer commit\"",
        "git remote add origin git@github.com:usuario/repositorio.git",
        "git push -u origin main"
      ]
    },
    {
      title: "4. Clonar repo existente",
      description: "Trae un proyecto desde GitHub hacia tu Android workstation.",
      commands: [
        "cd ~/workspace",
        "git clone git@github.com:usuario/repositorio.git",
        "cd repositorio"
      ]
    },
    {
      title: "5. Flujo diario",
      description: "Sincroniza antes de trabajar y publica al terminar una tanda de cambios.",
      commands: [
        "git pull",
        "git status",
        "git add .",
        "git commit -m \"avance\"",
        "git push"
      ]
    },
    {
      title: "6. Revisar remotos y ramas",
      description: "Comandos utiles para confirmar a donde estas subiendo el codigo.",
      commands: [
        "git remote -v",
        "git branch",
        "git log --oneline --decorate -5"
      ]
    }
  ],
  tools: [
    ["node", "instalado: v22.22.2"],
    ["npm", "instalado: 10.9.7"],
    ["live-server", "instalado: servidor local con autorecarga"],
    ["git", "instalado: control de versiones"],
    ["rclone", "instalado: sincronizacion con Google Drive"],
    ["tmux", "instalado: sesiones persistentes"],
    ["ssh", "instalado: conexion segura, GitHub SSH y localhost.run"],
    ["codex", "instalado: agente IA de programacion"],
    ["proot-distro", "instalado: Ubuntu dentro de Termux"],
    ["termux-wake-lock", "instalado: evita suspension en sesiones largas"],
    ["nano", "instalado: editor simple"],
    ["python3", "instalado: scripting"],
    ["curl / wget", "instalado: descargas y pruebas HTTP"],
    ["free-claude-code", "instalado: proxy local para desviar llamadas de claude a otros proveedores (Gemini, etc.)"]
  ],
  results: [
    "Servidor local activo en 127.0.0.1:8080",
    "Acceso publico temporal con localhost.run por SSH",
    "Proyecto modular en ~/workspace/uso-com-n-",
    "Formulario que adapta comandos a tus datos",
    "HTML separado de CSS y JavaScript",
    "Comandos en recuadros copiables",
    "Node v22.22.2 y npm 10.9.7 instalados",
    "GitHub listo mediante Git + SSH"
  ],
  futureNotes: [
    {
      title: "Estado actual",
      commands: [
        "Proyecto: ~/workspace/uso-com-n-",
        "Servidor: http://127.0.0.1:8080",
        "Tunel publico: ssh -R 80:localhost:8080 nokey@localhost.run",
        "Entrada principal: index.html",
        "Contenido fijo: js/content.js",
        "Configurador y botones: js/app.js",
        "Estilos: css/style.css"
      ]
    },
    {
      title: "Como pedirme cambios despues",
      commands: [
        "Agrega otro campo al configurador",
        "Crea comandos para GitHub Pages",
        "Agrega un boton para guardar mis datos",
        "Prepara este proyecto para subirlo a GitHub",
        "Crea una version instalable como plantilla"
      ]
    }
  ],
  skills: [
    {
      title: "Aliases generales",
      description: "Comandos cortos para el dia a dia en Termux/Ubuntu.",
      file: "termux-bash/aliases.sh",
      items: [
        "update - actualizar paquetes",
        "cls - limpiar y recargar bashrc",
        "ll - listar archivos detallado",
        "uni - ir a universida-datos",
        "weather - clima en Puno",
        "sysinfo - info del sistema",
        "editui - editar bashrc"
      ]
    },
    {
      title: "Herramientas IA",
      description: "Acceso rapido a agentes de IA para codigo.",
      file: "termux-bash/ia-tools.sh",
      items: [
        "codex / codex-full",
        "anti / anti-full (Antigravity)",
        "cl / cl-full (Claude Code)",
        "ocode / ocode-full (OpenCode)"
      ]
    },
    {
      title: "Funciones HTML",
      description: "Funciones bash para servir, publicar y versionar el proyecto web.",
      file: "termux-bash/functions.sh",
      items: [
        "html-serve [puerto] - servir pagina",
        "html-push [mensaje] - git push rapido",
        "html-status - estado del repo",
        "html-public [puerto] - tunel SSH",
        "html-clone - clonar o actualizar"
      ]
    },
    {
      title: "MOTD personalizado",
      description: "Pantalla de bienvenida con fecha, memoria y comandos rapidos al abrir terminal.",
      file: "termux-bash/motd.sh",
      items: [
        "Fecha y hora actual",
        "Directorio de trabajo",
        "Uso de memoria",
        "Lista de comandos disponibles",
        "Frase del dia"
      ]
    },
    {
      title: "Sincronizacion",
      description: "Las skills viven en skills/agent-skills/ del repo. Sincronizacion automatica y segura entre dispositivos.",
      file: "skills/sync-agent-skills.*",
      items: [
        "skills-sync - descarga y vuelve a enlazar todas las skills",
        "skills-push - sube cambios a GitHub (modo seguro, solo agrega)",
        "Usa Symlinks en Unix (Termux/Ubuntu) y Junctions en Windows",
        "Los cambios locales se reflejan al instante en todos tus agentes"
      ]
    },
    {
      title: "Claude Code",
      description: "Claude consume las skills compartidas sincronizadas desde el repo.",
      file: "skills/agent-skills/",
      items: [
        "agent-reach/ - busqueda y navegacion",
        "ponytail/ - enfoque minimalista",
        "kicad/ - analisis de hardware"
      ]
    },
    {
      title: "OpenCode",
      description: "OpenCode usa la misma biblioteca compartida de skills.",
      file: "skills/agent-skills/",
      items: [
        "frontend-design/ - interfaces web",
        "visual-design-foundations/ - sistema visual",
        "api-design-principles/ - diseño de APIs"
      ]
    },
    {
      title: "Codex",
      description: "Codex también se alimenta del mismo directorio sincronizado.",
      file: "skills/agent-skills/",
      items: [
        "systematic-debugging/ - resolver bugs",
        "postgresql/ - modelado de datos",
        "changelog-automation/ - releases"
      ]
    },
    {
      title: "Antigravity",
      description: "Antigravity recibe las skills compartidas y su propia config local.",
      file: "skills/agent-skills/",
      items: [
        "claude-mem/ - memoria persistente",
        "superpowers/ - flujo de trabajo",
        "rtk/ - ahorro de tokens"
      ]
    }
  ]
};
