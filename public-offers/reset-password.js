(function () {
  "use strict";

  const config = window.SUPABASE_CONFIG || {};
  const intro = document.getElementById("recovery-intro");
  const form = document.getElementById("recovery-form");
  const password = document.getElementById("recovery-password");
  const confirmation = document.getElementById("recovery-password-confirmation");
  const showPassword = document.getElementById("recovery-show-password");
  const status = document.getElementById("recovery-status");
  const submit = document.getElementById("recovery-submit");
  const recoveryRequested = new URLSearchParams(window.location.hash.slice(1)).get("type") === "recovery";

  function showStatus(message, kind = "") {
    status.textContent = message;
    status.className = `status ${kind}`.trim();
  }

  function showInvalidLink() {
    intro.textContent = "Este link expirou, já foi usado ou não é um link de recuperação válido. Solicite um novo e-mail no painel Supabase.";
    form.classList.add("hidden");
  }

  if (!/^https:\/\/[a-z0-9-]+\.supabase\.co$/i.test(String(config.url || "").replace(/\/$/, ""))
    || String(config.anonKey || "").length < 40
    || !window.supabase?.createClient) {
    intro.textContent = "A recuperação de senha ainda não está configurada.";
    return;
  }

  const client = window.supabase.createClient(String(config.url).replace(/\/$/, ""), String(config.anonKey), {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: true,
    },
  });

  async function initialize() {
    const { data, error } = await client.auth.getSession();
    if (error || !recoveryRequested || !data?.session?.user?.email) {
      showInvalidLink();
      return;
    }

    intro.textContent = `Link validado para ${data.session.user.email}. Escolha uma senha nova e exclusiva.`;
    form.classList.remove("hidden");
    password.focus();
  }

  showPassword.addEventListener("change", () => {
    const type = showPassword.checked ? "text" : "password";
    password.type = type;
    confirmation.type = type;
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    if (password.value !== confirmation.value) {
      showStatus("As duas senhas precisam ser iguais.", "error");
      confirmation.focus();
      return;
    }

    const newPassword = password.value;
    const { data: sessionData } = await client.auth.getSession();
    const email = sessionData?.session?.user?.email;
    if (!email) {
      showInvalidLink();
      return;
    }

    submit.disabled = true;
    showStatus("Alterando a senha Supabase…");

    const { error: updateError } = await client.auth.updateUser({ password: newPassword });
    if (updateError) {
      showStatus(`Não foi possível alterar a senha: ${updateError.message}`, "error");
      submit.disabled = false;
      return;
    }

    await client.auth.signOut({ scope: "local" });
    const { data: loginData, error: loginError } = await client.auth.signInWithPassword({
      email,
      password: newPassword,
    });

    password.value = "";
    confirmation.value = "";
    if (loginError || !loginData?.session) {
      showStatus("A senha foi alterada, mas a validação do login falhou. Volte ao painel Supabase.", "error");
      submit.disabled = false;
      return;
    }

    showStatus("Senha alterada e login Supabase validado com sucesso.", "success");
    submit.textContent = "Concluído";
    form.querySelectorAll("input").forEach((input) => { input.disabled = true; });
  });

  initialize();
}());
