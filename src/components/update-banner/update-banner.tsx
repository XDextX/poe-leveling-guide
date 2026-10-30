/* Aviso de "hay una versión nueva": el service worker nuevo espera instalado y la página lo activa cuando el usuario lo pide. */
import "./update-banner.css";

/** Avisa cuando hay una versión nueva esperando y recarga la página con ella al pulsar. */
export function initUpdateBanner(reg: ServiceWorkerRegistration): void {
  const offer = (worker: ServiceWorker) => {
    const banner = (
      <div class="update-banner" role="status">
        <span>Hay una versión nueva de la guía.</span>
        <button type="button" class="primary" onClick={() => worker.postMessage("skipWaiting")}>Actualizar</button>
      </div>
    ) as HTMLElement;
    document.body.append(banner);
  };
  // Con un worker ya esperando (se abrió la página sin pulsar antes) o uno que acaba de instalarse mientras hay otro activo.
  if (reg.waiting && navigator.serviceWorker.controller) offer(reg.waiting);
  reg.addEventListener("updatefound", () => {
    const next = reg.installing;
    next?.addEventListener("statechange", () => { if (next.state === "installed" && navigator.serviceWorker.controller) offer(next); });
  });
  navigator.serviceWorker.addEventListener("controllerchange", () => location.reload());
}
