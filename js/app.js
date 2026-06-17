const modulesGrid = document.querySelector("#modules-grid");
const serverGrid = document.querySelector("#server-grid");
const termuxGrid = document.querySelector("#termux-grid");
const tunnelGrid = document.querySelector("#tunnel-grid");
const workflowList = document.querySelector("#workflow-list");
const githubGrid = document.querySelector("#github-grid");
const sshGithubGrid = document.querySelector("#ssh-github-grid");
const mgitGrid = document.querySelector("#mgit-grid");
const shortcutsGrid = document.querySelector("#shortcuts-grid");
const fccGrid = document.querySelector("#fcc-grid");
const skillsGrid = document.querySelector("#skills-grid");
const toolsTable = document.querySelector("#tools-table");
const resultList = document.querySelector("#result-list");
const futureNotes = document.querySelector("#future-notes");
const configForm = document.querySelector("#config-form");

const storageKey = "android-workstation-config";

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function createCopyBlock(commands) {
  const block = document.createElement("div");
  block.className = "copy-block";

  const codeText = commands.join("\n");
  const codeLines = commands.map((command) => `<code>${escapeHtml(command)}</code>`).join("");

  block.innerHTML = `
    <button class="copy-btn" type="button">Copiar</button>
    <pre>${codeLines}</pre>
  `;

  const button = block.querySelector(".copy-btn");
  button.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(codeText);
      button.textContent = "Copiado";
    } catch (error) {
      button.textContent = "Error";
    }

    setTimeout(() => {
      button.textContent = "Copiar";
    }, 1400);
  });

  return block;
}

function createModuleCard(module) {
  const card = document.createElement("article");
  card.className = "module-card";

  const title = document.createElement("h3");
  title.textContent = module.title;

  const description = document.createElement("p");
  description.textContent = module.description;

  const list = document.createElement("ul");
  module.items.forEach((item) => {
    const listItem = document.createElement("li");
    listItem.textContent = item;
    list.appendChild(listItem);
  });

  card.append(title, description, list);

  if (module.command) {
    card.appendChild(createCopyBlock([module.command]));
  }

  return card;
}

function createCommandCard(section) {
  const card = document.createElement("article");
  card.className = "github-card";

  const title = document.createElement("h3");
  title.textContent = section.title;

  const description = document.createElement("p");
  description.textContent = section.description;

  card.append(title, description, createCopyBlock(section.commands));
  return card;
}

function getConfigValues() {
  const data = new FormData(configForm);
  const values = Object.fromEntries(data.entries());

  return {
    gitName: values.gitName?.trim() || "ENZO",
    gitEmail: values.gitEmail?.trim() || "renzomamanigalindo@gmail.com",
    repoUrl: values.repoUrl?.trim() || "https://github.com/gaelrenzo/uso-com-n-",
    githubUser: values.githubUser?.trim() || "gaelrenzo",
    repoName: values.repoName?.trim() || "uso-com-n-",
    projectPath: values.projectPath?.trim() || "/root/Workspace/html",
    port: values.port?.trim() || "8080",
    fccPort: values.fccPort?.trim() || "8082"
  };
}

function parseGithubUrl(repoUrl, fallbackUser, fallbackRepo) {
  const cleaned = repoUrl.trim().replace(/\.git$/, "").replace(/\/$/, "");
  const match = cleaned.match(/github\.com\/([^/]+)\/([^/]+)$/);

  if (!match) {
    return { user: fallbackUser, repo: fallbackRepo };
  }

  return { user: match[1], repo: match[2] };
}

function getContext() {
  const values = getConfigValues();
  const repo = parseGithubUrl(values.repoUrl, values.githubUser, values.repoName);

  return {
    ...values,
    githubUser: repo.user,
    repoName: repo.repo,
    localUrl: `http://127.0.0.1:${values.port}`,
    localhostUrl: `http://localhost:${values.port}`,
    tunnelCommand: `ssh -R 80:localhost:${values.port} nokey@localhost.run`,
    githubWeb: `https://github.com/${repo.user}/${repo.repo}`,
    sshRemote: `git@github.com:${repo.user}/${repo.repo}.git`,
    httpsRemote: `https://github.com/${repo.user}/${repo.repo}.git`
  };
}

function saveConfig() {
  localStorage.setItem(storageKey, JSON.stringify(getConfigValues()));
}

function loadConfig() {
  const saved = localStorage.getItem(storageKey);
  if (!saved) return;

  try {
    const values = JSON.parse(saved);
    if (values.gitName === "Tu Nombre") values.gitName = "ENZO";
    if (values.gitEmail === "tu-correo.com") values.gitEmail = "renzomamanigalindo.com";
    Object.entries(values).forEach(([key, value]) => {
      const input = configForm.elements[key];
      if (input) input.value = value;
    });
  } catch (error) {
    localStorage.removeItem(storageKey);
  }
}

function buildTermuxSections(ctx) {
  return [
    {
      title: "1. Instalar herramientas en Termux",
      description: "Actualiza Termux e instala Git, Node.js, SSH, nano, tmux y live-server.",
      commands: [
        "pkg update && pkg upgrade",
        "pkg install git nodejs-lts openssh curl nano tmux",
        "npm install -g live-server"
      ]
    },
    {
      title: "2. Clonar este repositorio",
      description: "Crea una carpeta de trabajo y trae la pagina desde GitHub.",
      commands: [
        "mkdir -p ~/workspace",
        "cd ~/workspace",
        "git clone " + ctx.httpsRemote,
        "cd " + ctx.repoName
      ]
    },
    {
      title: "3. Encender la pagina",
      description: "Sirve el HTML con autorecarga para verlo desde el navegador Android.",
      commands: [
        "live-server --host=127.0.0.1 --port=" + ctx.port,
        ctx.localUrl
      ]
    },
    {
      title: "4. Usar Ubuntu proot",
      description: "Si prefieres trabajar dentro de Ubuntu en Termux, instala proot-distro y entra al sistema.",
      commands: [
        "pkg install proot-distro",
        "proot-distro install ubuntu",
        "proot-distro login ubuntu",
        "apt update && apt upgrade -y",
        "apt install -y git curl nano openssh-client nodejs npm"
      ]
    },
    {
      title: "5. Editar y guardar cambios",
      description: "Edita los archivos principales y publica el avance en GitHub.",
      commands: [
        "nano index.html",
        "nano js/content.js",
        "nano css/style.css",
        "git add . && git commit -m \"avance\" && git push"
      ]
    },
    {
      title: "6. Mantener la sesion activa",
      description: "Usa wake-lock y tmux para que el trabajo no se corte en sesiones largas.",
      commands: [
        "termux-wake-lock",
        "tmux",
        "termux-wake-unlock"
      ]
    }
  ];
}

function buildServerSections(ctx) {
  return [
    {
      title: "1. Carpeta del proyecto HTML",
      description: "Aqui vive esta pagina modular. Cambia la ruta en el formulario y estos comandos se actualizan.",
      commands: [
        `cd ${ctx.projectPath}`,
        "ls -la",
        "find . -maxdepth 3 -type f"
      ]
    },
    {
      title: "2. Encender el servidor",
      description: "live-server sirve la pagina y recarga el navegador cuando guardas cambios.",
      commands: [
        `cd ${ctx.projectPath}`,
        `live-server --host=127.0.0.1 --port=${ctx.port}`
      ]
    },
    {
      title: "3. Conexion desde el navegador",
      description: "Abre una de estas direcciones en Chrome Android, Firefox o el navegador del sistema.",
      commands: [
        ctx.localUrl,
        ctx.localhostUrl
      ]
    },
    {
      title: "4. Verificar que responde",
      description: "Este comando confirma que el servidor esta entregando el HTML correctamente.",
      commands: [
        `curl -I ${ctx.localUrl}`
      ]
    },
    {
      title: "5. Donde colocar o cambiar datos",
      description: "El formulario actualiza comandos. Para cambios permanentes, edita estos archivos.",
      commands: [
        "nano index.html        # estructura de secciones",
        "nano js/content.js     # textos, listas y comandos fijos",
        "nano js/app.js         # logica del formulario y render",
        "nano css/style.css     # diseño visual"
      ]
    }
  ];
}

function buildTunnelSections(ctx) {
  return [
    {
      title: "Opcion 1: SSH con localhost.run",
      description: "Publica temporalmente tu servidor local sin instalar nada extra.",
      commands: [
        ctx.tunnelCommand
      ]
    },
    {
      title: "Flujo recomendado",
      description: "Primero enciende live-server. Luego abre otra terminal o panel tmux para ejecutar el tunel SSH.",
      commands: [
        `cd ${ctx.projectPath}`,
        `live-server --host=127.0.0.1 --port=${ctx.port}`,
        ctx.tunnelCommand
      ]
    },
    {
      title: "Como usar la URL publica",
      description: "localhost.run mostrara una URL HTTPS publica. Esa URL funciona mientras la terminal del tunel siga abierta.",
      commands: [
        "Ejemplo de salida: https://tu-servidor.lhr.life",
        "Abre esa URL en cualquier navegador",
        "Manten la terminal abierta mientras uses el enlace"
      ]
    }
  ];
}

function buildWorkflow(ctx) {
  return [
    ["Abrir Termux", "termux-wake-lock"],
    ["Entrar a Ubuntu si vas a trabajar ahi", "proot-distro login ubuntu"],
    ["Abrir tmux", "tmux"],
    ["Ir al proyecto", `cd ${ctx.projectPath}`],
    ["Encender servidor", `live-server --host=127.0.0.1 --port=${ctx.port}`],
    ["Abrir navegador", ctx.localUrl],
    ["Publicar temporalmente", ctx.tunnelCommand],
    ["Versionar cambios", "git add . && git commit -m \"avance\" && git push"]
  ];
}

function buildGithubSections(ctx) {
  return [
    {
      title: "1. Configurar identidad Git",
      description: "Define el nombre y correo que apareceran en tus commits.",
      commands: [
        `git config --global user.name "${ctx.gitName}"`,
        `git config --global user.email "${ctx.gitEmail}"`,
        "git config --global init.defaultBranch main"
      ]
    },
    {
      title: "2. Crear llave SSH",
      description: "La llave SSH evita usar contrasena cada vez que haces push o pull.",
      commands: [
        `ssh-keygen -t ed25519 -C "${ctx.gitEmail}"`,
        "cat ~/.ssh/id_ed25519.pub",
        "ssh -T git@github.com"
      ]
    },
    {
      title: "3. Subir proyecto por SSH",
      description: "Usa estos comandos cuando ya creaste el repositorio en GitHub.",
      commands: [
        `cd ${ctx.projectPath}`,
        "git init",
        "git add .",
        "git commit -m \"primer commit\"",
        `git remote add origin ${ctx.sshRemote}`,
        "git push -u origin main"
      ]
    },
    {
      title: "4. Subir proyecto por HTTPS",
      description: "Alternativa si todavia no configuraste llave SSH.",
      commands: [
        `cd ${ctx.projectPath}`,
        "git init",
        "git add .",
        "git commit -m \"primer commit\"",
        `git remote add origin ${ctx.httpsRemote}`,
        "git push -u origin main"
      ]
    },
    {
      title: "5. Clonar repo existente",
      description: "Trae el proyecto desde GitHub hacia tu Android workstation.",
      commands: [
        "cd ~/workspace",
        `git clone ${ctx.sshRemote}`,
        `cd ${ctx.repoName}`
      ]
    },
    {
      title: "6. Flujo diario Git",
      description: "Sincroniza antes de trabajar y publica al terminar una tanda de cambios.",
      commands: [
        "git pull",
        "git status",
        "git add .",
        "git commit -m \"avance\"",
        "git push"
      ]
    }
  ];
}


function buildSshGithubSections(ctx) {
  return [
    {
      title: "1. Configuracion global de Git",
      description: "Estos datos quedaron guardados para que Git use el nombre ENZO, el correo de GitHub y la rama inicial main.",
      commands: [
        "git config --global user.name \"" + ctx.gitName + "\"",
        "git config --global user.email \"" + ctx.gitEmail + "\"",
        "git config --global init.defaultBranch main"
      ]
    },
    {
      title: "2. Generar clave SSH Ed25519",
      description: "Al presionar Enter se guardo en la ruta por defecto. La passphrase se dejo vacia, asi que no pedira clave extra al usar Git.",
      commands: [
        "ssh-keygen -t ed25519 -C \"" + ctx.gitEmail + "\"",
        "Enter file in which to save the key (/root/.ssh/id_ed25519):",
        "Enter passphrase (empty for no passphrase):",
        "Enter same passphrase again:"
      ]
    },
    {
      title: "3. Archivos creados",
      description: "La privada no se comparte. La publica es la que se pega en GitHub.",
      commands: [
        "Clave privada: /root/.ssh/id_ed25519",
        "Clave publica: /root/.ssh/id_ed25519.pub",
        "Fingerprint: SHA256:ZjzJun/TiVHsXwX+ElzOZSSDOOSdng4zMF0S5SbD8bg"
      ]
    },
    {
      title: "4. Ver clave publica",
      description: "Copia la linea completa que empieza con ssh-ed25519 y termina con tu correo.",
      commands: [
        "cat ~/.ssh/id_ed25519.pub",
        "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIAIIjX5AjCQenykWhN4G9iCQBSVp97lkhbtkhVn5pCh8 " + ctx.gitEmail
      ]
    },
    {
      title: "5. Primer intento con GitHub",
      description: "La primera conexion agrego github.com a known_hosts. El Permission denied indicaba que GitHub aun no tenia registrada tu clave publica.",
      commands: [
        "ssh -T git@github.com",
        "Are you sure you want to continue connecting (yes/no/[fingerprint])? yes",
        "Warning: Permanently added github.com to the list of known hosts.",
        "git@github.com: Permission denied (publickey)."
      ]
    },
    {
      title: "6. Agregar clave en GitHub",
      description: "En GitHub se debe crear una nueva SSH key y pegar la clave publica completa.",
      commands: [
        "GitHub > Settings > SSH and GPG keys > New SSH key",
        "Pegar el contenido completo de ~/.ssh/id_ed25519.pub",
        "Guardar la clave"
      ]
    },
    {
      title: "7. Verificacion exitosa",
      description: "Este mensaje confirma que la autenticacion SSH ya funciona. Es normal que GitHub no entregue una shell interactiva.",
      commands: [
        "ssh -T git@github.com",
        "Hi gaelrenzo! Youve successfully authenticated, but GitHub does not provide shell access."
      ]
    },
    {
      title: "8. Usar repos por SSH",
      description: "A partir de aqui puedes clonar repos o cambiar un remoto HTTPS a SSH.",
      commands: [
        "git clone " + ctx.sshRemote,
        "git remote set-url origin " + ctx.sshRemote,
        "git remote -v"
      ]
    },
    {
      title: "Nota de seguridad",
      description: "Todo se hizo como root, por eso las claves estan en /root/.ssh. En produccion conviene un usuario no privilegiado y una passphrase.",
      commands: [
        "Usuario actual: root",
        "Ruta SSH: /root/.ssh/",
        "Clave sin passphrase: practica, pero menos segura"
      ]
    }
  ];
}

function buildMgitSections(ctx) {
  return [
    {
      title: "1. Que es MGit",
      description: "MGit es una app Android para clonar, revisar cambios, hacer commits, pull y push con GitHub usando interfaz grafica.",
      commands: [
        "Repositorio web: " + ctx.githubWeb,
        "HTTPS para MGit: " + ctx.httpsRemote,
        "SSH para Termux/Ubuntu: " + ctx.sshRemote
      ]
    },
    {
      title: "2. Clonar en MGit por HTTPS",
      description: "Es la forma mas simple dentro de MGit. Si GitHub pide acceso, usa un Personal Access Token, no tu contrasena normal.",
      commands: [
        "Abrir MGit",
        "Tocar + o Clone",
        "Pegar: " + ctx.httpsRemote,
        "Elegir carpeta del almacenamiento Android",
        "Confirmar Clone"
      ]
    },
    {
      title: "3. Usar SSH en MGit",
      description: "MGit no siempre puede leer la clave de /root/.ssh. Si quieres SSH en MGit, crea o importa una clave dentro de MGit y registra su publica en GitHub.",
      commands: [
        "MGit > Settings > SSH keys",
        "Generar o importar una clave en MGit",
        "Copiar la clave publica de MGit",
        "GitHub > Settings > SSH and GPG keys > New SSH key",
        "Clonar con: " + ctx.sshRemote
      ]
    },
    {
      title: "4. Flujo normal en MGit",
      description: "Haz Pull antes de editar y Push al terminar. Esto evita conflictos cuando tambien trabajas desde Termux o Ubuntu.",
      commands: [
        "Pull",
        "Editar archivos",
        "Status",
        "Stage/Add",
        "Commit: avance",
        "Push"
      ]
    },
    {
      title: "5. Si editas desde Termux y MGit",
      description: "No edites dos copias sin sincronizar. Antes de cambiar algo, trae los ultimos cambios; despues de terminar, subelos.",
      commands: [
        "Antes de editar: Pull en MGit o git pull en Termux",
        "Despues de editar: Commit + Push",
        "Si aparece conflicto: no borres archivos; revisa el archivo marcado y resuelve las diferencias"
      ]
    },
    {
      title: "6. Ruta importante",
      description: "Tu repo principal de Ubuntu esta en /root/Workspace/html. El clon de MGit estara en otra carpeta de Android si lo clonas desde la app.",
      commands: [
        "Ubuntu/Termux: " + ctx.projectPath,
        "Clon alternativo terminal: /root/workspace/" + ctx.repoName,
        "MGit: carpeta elegida dentro del almacenamiento Android"
      ]
    }
  ];
}

function buildShortcutSections(ctx) {
  return [
    {
      title: "1. Atajo para servir la pagina",
      description: "En vez de escribir cd y live-server, ejecuta un solo comando. Puedes pasar otro puerto si quieres.",
      commands: [
        "html-serve",
        "html-serve " + ctx.port,
        ctx.localUrl
      ]
    },
    {
      title: "2. Atajo para guardar y subir cambios",
      description: "Hace pull con rebase, agrega archivos, crea commit solo si hay cambios y hace push. El texto entre comillas es opcional.",
      commands: [
        "html-push",
        "html-push \"avance\"",
        "html-push \"actualiza guia MGit\""
      ]
    },
    {
      title: "3. Atajo para revisar estado",
      description: "Muestra rama, cambios pendientes, remoto y ultimos commits sin escribir varios comandos.",
      commands: [
        "html-status"
      ]
    },
    {
      title: "4. Atajo para publicar temporalmente",
      description: "Abre un tunel publico con localhost.run hacia tu live-server. Manten esa terminal abierta mientras uses el enlace.",
      commands: [
        "html-public",
        "html-public " + ctx.port
      ]
    },
    {
      title: "5. Atajo para clonar o actualizar copia",
      description: "Si no existe /root/workspace/uso-com-n-, lo clona. Si ya existe, entra y hace pull.",
      commands: [
        "html-clone"
      ]
    },
    {
      title: "6. Si el comando no aparece",
      description: "Los atajos quedaron instalados en /usr/local/bin. Si tu shell no los detecta, abre otra terminal o verifica la ruta.",
      commands: [
        "command -v html-serve",
        "command -v html-push",
        "ls -la /usr/local/bin/html-*"
      ]
    }
  ];
}

function updateFccStaticSections(ctx) {
  document.querySelectorAll(".fcc-port-cmd").forEach((el) => {
    el.textContent = `fcc-server --port ${ctx.fccPort}`;
  });
  document.querySelectorAll(".fcc-admin-url").forEach((el) => {
    el.textContent = `http://127.0.0.1:${ctx.fccPort}/admin`;
  });
  document.querySelectorAll(".fcc-settings-url").forEach((el) => {
    el.textContent = `  { "name": "ANTHROPIC_BASE_URL", "value": "http://localhost:${ctx.fccPort}" },`;
  });

  document.querySelectorAll("#fcc-grid .copy-block").forEach((block) => {
    const button = block.querySelector(".copy-btn");
    if (!button) return;
    const codeLines = Array.from(block.querySelectorAll("pre code")).map(c => c.textContent);
    const codeText = codeLines.join("\n");

    const newButton = button.cloneNode(true);
    button.parentNode.replaceChild(newButton, button);

    newButton.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(codeText);
        newButton.textContent = "Copiado";
      } catch (error) {
        newButton.textContent = "Error";
      }

      setTimeout(() => {
        newButton.textContent = "Copiar";
      }, 1400);
    });
  });
}

function buildResults(ctx) {
  return [
    `Servidor local activo en ${ctx.localUrl}`,
    "Acceso publico temporal con localhost.run por SSH",
    `Proyecto modular en ${ctx.projectPath}`,
    `Repositorio GitHub: ${ctx.githubWeb}`,
    "Formulario conectado a todos los pasos",
    "HTML separado de CSS y JavaScript",
    "Comandos copiables sin simbolo de prompt",
    "GitHub listo mediante Git + SSH",
    "MGit documentado para usar desde Android",
    "Atajos html-serve, html-push, html-status, html-public y html-clone instalados",
    `Free Claude Code configurado y listo en el puerto ${ctx.fccPort}`
  ];
}

function buildFutureNotes(ctx) {
  return [
    {
      title: "Estado actual",
      commands: [
        `Proyecto: ${ctx.projectPath}`,
        `Servidor: ${ctx.localUrl}`,
        `Tunel publico: ${ctx.tunnelCommand}`,
        `GitHub web: ${ctx.githubWeb}`,
        `GitHub SSH: ${ctx.sshRemote}`,
        `GitHub HTTPS: ${ctx.httpsRemote}`,
        "Archivos clave: index.html, css/style.css, js/content.js, js/app.js",
        "Atajos: html-serve, html-push, html-status, html-public, html-clone",
        `Free Claude Code: http://127.0.0.1:${ctx.fccPort}`
      ]
    },
    {
      title: "Como pedirme cambios despues",
      commands: [
        "Agrega otro campo al formulario",
        "Crea comandos para GitHub Pages",
        "Agrega un boton para guardar mis datos como archivo",
        "Prepara este proyecto para subirlo a GitHub",
        "Crea una version instalable como plantilla"
      ]
    }
  ];
}

function clearDynamicSections() {
  serverGrid.innerHTML = "";
  termuxGrid.innerHTML = "";
  tunnelGrid.innerHTML = "";
  workflowList.innerHTML = "";
  githubGrid.innerHTML = "";
  sshGithubGrid.innerHTML = "";
  mgitGrid.innerHTML = "";
  shortcutsGrid.innerHTML = "";
  resultList.innerHTML = "";
  futureNotes.innerHTML = "";
}

function renderCommandCards(container, sections) {
  sections.forEach((section) => {
    container.appendChild(createCommandCard(section));
  });
}

function renderWorkflow(ctx) {
  buildWorkflow(ctx).forEach(([title, command]) => {
    const item = document.createElement("li");
    const content = document.createElement("div");

    const stepTitle = document.createElement("p");
    stepTitle.className = "step-title";
    stepTitle.textContent = title;

    content.append(stepTitle, createCopyBlock([command]));
    item.appendChild(content);
    workflowList.appendChild(item);
  });
}

function renderResults(ctx) {
  buildResults(ctx).forEach((result) => {
    const item = document.createElement("div");
    item.className = "result-item";
    item.textContent = result;
    resultList.appendChild(item);
  });
}

function renderFutureNotes(ctx) {
  buildFutureNotes(ctx).forEach((note) => {
    const card = document.createElement("article");
    card.className = "github-card note-card";

    const title = document.createElement("h3");
    title.textContent = note.title;

    card.append(title, createCopyBlock(note.commands));
    futureNotes.appendChild(card);
  });
}

function renderDynamicSections() {
  const ctx = getContext();
  clearDynamicSections();
  renderCommandCards(termuxGrid, buildTermuxSections(ctx));
  renderCommandCards(serverGrid, buildServerSections(ctx));
  renderCommandCards(tunnelGrid, buildTunnelSections(ctx));
  renderWorkflow(ctx);
  renderCommandCards(githubGrid, buildGithubSections(ctx));
  renderCommandCards(sshGithubGrid, buildSshGithubSections(ctx));
  renderCommandCards(mgitGrid, buildMgitSections(ctx));
  renderCommandCards(shortcutsGrid, buildShortcutSections(ctx));
  updateFccStaticSections(ctx);
  renderResults(ctx);
  renderFutureNotes(ctx);
}

function renderStaticSections() {
  workstationContent.modules.forEach((module) => {
    modulesGrid.appendChild(createModuleCard(module));
  });

  workstationContent.skills.forEach((skill) => {
    const card = document.createElement("article");
    card.className = "github-card";

    const title = document.createElement("h3");
    title.textContent = skill.title;

    const description = document.createElement("p");
    description.textContent = skill.description;

    const file = document.createElement("p");
    file.className = "skill-file";
    file.textContent = "📁 " + skill.file;

    const list = document.createElement("ul");
    skill.items.forEach((item) => {
      const li = document.createElement("li");
      li.textContent = item;
      list.appendChild(li);
    });

    card.append(title, description, file, list);
    skillsGrid.appendChild(card);
  });

  document.getElementById("skills-aliases-count").textContent = "7 alias";
  document.getElementById("skills-ia-count").textContent = "8 alias";
  document.getElementById("skills-fn-count").textContent = "5 funciones";

  workstationContent.tools.forEach(([tool, purpose]) => {
    const row = document.createElement("tr");
    const toolCell = document.createElement("td");
    const purposeCell = document.createElement("td");

    toolCell.textContent = tool;
    purposeCell.textContent = purpose;
    row.append(toolCell, purposeCell);
    toolsTable.appendChild(row);
  });
}

function setupConfigForm() {
  loadConfig();
  renderDynamicSections();

  configForm.addEventListener("input", () => {
    saveConfig();
    renderDynamicSections();
  });
}

renderStaticSections();
setupConfigForm();
