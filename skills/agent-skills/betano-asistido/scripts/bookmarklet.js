// Exportar cuotas visibles de betano.pe (lo ejecuta el usuario con un toque; no hace peticiones al servidor).
// Descarga betano-AAAAMMDD-HHMMSS.json en Descargas y además intenta copiarlo al portapapeles.
(function () {
  var d = new Date(), p = function (n) { return ("0" + n).slice(-2); };
  var ts = d.getFullYear() + p(d.getMonth() + 1) + p(d.getDate()) + "-" + p(d.getHours()) + p(d.getMinutes()) + p(d.getSeconds());
  var main = document.querySelector("main") || document.body;
  var data = JSON.stringify({ fuente: "betano-bookmarklet", v: 1, url: location.href, titulo: document.title,
    fecha: d.toISOString(), texto: main.innerText });
  var a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([data], { type: "application/json" }));
  a.download = "betano-" + ts + ".json";
  document.body.appendChild(a); a.click(); a.remove();
  try { navigator.clipboard.writeText(data); } catch (e) {}
  alert("Cuotas exportadas: betano-" + ts + ".json (" + main.innerText.split("\n").length + " lineas)");
})();
