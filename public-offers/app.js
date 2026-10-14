(function () {
  "use strict";

  const config = window.SUPABASE_CONFIG || {};
  const loading = document.getElementById("offer-loading");
  const errorPanel = document.getElementById("offer-error");
  const errorTitle = document.getElementById("offer-error-title");
  const errorMessage = document.getElementById("offer-error-message");
  const viewer = document.getElementById("offer-viewer");
  const gallery = document.getElementById("offer-gallery");
  const fullscreen = document.getElementById("offer-fullscreen");
  const fullscreenContent = document.getElementById("offer-fullscreen-content");
  const fullscreenClose = document.getElementById("offer-fullscreen-close");
  const title = document.getElementById("offer-title");
  const validity = document.getElementById("offer-validity");
  let activeFigure = null;
  let activeImage = null;

  function openFullscreen(figure) {
    if (fullscreen.open || !figure) return;
    const image = figure.querySelector("img");
    if (!image) return;

    activeFigure = figure;
    activeImage = image;
    fullscreenContent.appendChild(image);
    fullscreen.showModal();
    fullscreenClose.focus();
  }

  function closeFullscreen() {
    if (fullscreen.open) fullscreen.close();
  }

  fullscreen.addEventListener("close", () => {
    if (activeFigure && activeImage) {
      activeFigure.appendChild(activeImage);
      activeFigure.focus();
    }
    activeFigure = null;
    activeImage = null;
  });

  fullscreenClose.addEventListener("click", closeFullscreen);
  fullscreen.addEventListener("click", (event) => {
    if (event.target === fullscreen) closeFullscreen();
  });
  fullscreen.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;
    event.preventDefault();
    closeFullscreen();
  });

  gallery.addEventListener("click", (event) => {
    const figure = event.target.closest("figure");
    if (figure && gallery.contains(figure)) openFullscreen(figure);
  });

  gallery.addEventListener("keydown", (event) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    const figure = event.target.closest("figure");
    if (!figure || !gallery.contains(figure)) return;
    event.preventDefault();
    openFullscreen(figure);
  });

  function showError(titleText, message) {
    loading.classList.add("hidden");
    viewer.classList.add("hidden");
    gallery.classList.add("hidden");
    errorTitle.textContent = titleText;
    errorMessage.textContent = message;
    errorPanel.classList.remove("hidden");
  }

  function parsePublicId() {
    const parts = window.location.pathname.split("/").filter(Boolean);
    const offerIndex = parts.indexOf("oferta");
    const value = offerIndex >= 0
      ? parts[parts.length - 1]
      : new URLSearchParams(window.location.search).get("id");
    if (/^[a-f0-9]{48}$/.test(value || "")) return { column: "public_id", value };
    if (/^[A-Za-z0-9_-]{22}$/.test(value || "")) return { column: "short_id", value };
    return null;
  }

  function toDate(value) {
    if (!value) return null;
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  async function loadOffer() {
    const offerIdentifier = parsePublicId();
    if (!offerIdentifier) {
      showError("Link inválido", "Confira se o endereço recebido está completo.");
      return;
    }
    if (!/^https:\/\/[a-z0-9-]+\.supabase\.co$/i.test(String(config.url || "").replace(/\/$/, ""))
      || String(config.anonKey || "").length < 40
      || !window.supabase?.createClient) {
      showError("Página ainda não configurada", "A publicação precisa ser ativada pela farmácia.");
      return;
    }

    try {
      const client = window.supabase.createClient(String(config.url).replace(/\/$/, ""), String(config.anonKey), {
        auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
      });
      const { data: offer, error } = await client
        .from("offers")
        .select("public_id,short_id,title,images,created_at,expires_at,active")
        .eq(offerIdentifier.column, offerIdentifier.value)
        .maybeSingle();
      if (error) throw error;
      if (!offer) {
        showError("Oferta indisponível", "Este link pode ter expirado ou sido desativado.");
        return;
      }

      const expiresAt = toDate(offer.expires_at);
      if (!offer.active || (expiresAt && expiresAt.getTime() <= Date.now())) {
        showError("Oferta encerrada", "Esta oferta não está mais disponível.");
        return;
      }

      const images = Array.isArray(offer.images)
        ? offer.images.slice().sort((left, right) => Number(left.order) - Number(right.order))
        : [];
      if (!images.length) {
        showError("Oferta sem imagens", "A publicação ainda não possui imagens disponíveis.");
        return;
      }

      title.textContent = String(offer.title || "Ofertas especiais").slice(0, 120);
      document.title = title.textContent;
      if (expiresAt) {
        validity.textContent = `Válida até ${new Intl.DateTimeFormat("pt-BR").format(expiresAt)}`;
        validity.classList.remove("hidden");
      }

      const renderedImages = await Promise.all(images.map(async (image, index) => {
        if (!image || typeof image.path !== "string" || !/^[a-f0-9-]{36}\/[a-f0-9]{48}\/[A-Za-z0-9._-]+$/.test(image.path)) return;
        const { data, error: imageError } = await client.storage.from("offer-images").download(image.path);
        if (imageError || !data) return null;
        const figure = document.createElement("figure");
        figure.tabIndex = 0;
        figure.setAttribute("role", "button");
        figure.setAttribute("aria-label", `Ampliar ${title.textContent}, imagem ${index + 1}`);
        const element = document.createElement("img");
        const objectUrl = URL.createObjectURL(data);
        element.src = objectUrl;
        element.alt = `${title.textContent} — imagem ${index + 1}`;
        element.loading = index === 0 ? "eager" : "lazy";
        element.decoding = "async";
        element.referrerPolicy = "no-referrer";
        element.addEventListener("load", () => URL.revokeObjectURL(objectUrl), { once: true });
        element.addEventListener("error", () => URL.revokeObjectURL(objectUrl), { once: true });
        figure.appendChild(element);
        return figure;
      }));
      const fragment = document.createDocumentFragment();
      renderedImages.filter(Boolean).forEach((figure) => fragment.appendChild(figure));
      gallery.replaceChildren(fragment);
      if (!gallery.children.length) {
        showError("Oferta sem imagens", "As imagens desta publicação não estão disponíveis.");
        return;
      }

      loading.classList.add("hidden");
      viewer.classList.remove("hidden");
    } catch (error) {
      console.error("Falha ao carregar oferta pública:", error);
      showError("Oferta indisponível", "Este link pode ter expirado, sido desativado ou estar temporariamente indisponível.");
    }
  }

  loadOffer();
})();
