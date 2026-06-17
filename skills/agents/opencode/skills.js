export const skills = [
  {
    name: "proyecto-info",
    description: "Muestra informacion del proyecto uso-com-n-",
    execute: async () => {
      return {
        project: "uso-com-n-",
        path: "/root/Workspace/html",
        server: "http://127.0.0.1:8080",
        repo: "https://github.com/gaelrenzo/uso-com-n-",
        stack: "HTML + CSS + JS vanilla",
        tools: "live-server, git, node, npm"
      }
    }
  },
  {
    name: "html-serve",
    description: "Inicia el servidor local de desarrollo",
    execute: async (port = 8080) => {
      return `live-server --host=127.0.0.1 --port=${port}`
    }
  },
  {
    name: "git-push-rapido",
    description: "Hace commit y push con un mensaje",
    execute: async (msg = "avance") => {
      return `git pull --rebase && git add . && git commit -m "${msg}" && git push`
    }
  }
]
