(function () {
  "use strict";
  const api = window.StudyFlow;

  function redirectAfterAuthentication() {
    const requested = new URLSearchParams(location.search).get("next");
    const safePages = new Set(["dashboard.html", "tasks.html", "calendar.html", "progress.html", "notifications.html", "profile.html"]);
    const destination = requested && safePages.has(requested.split("#")[0]) ? requested : "dashboard.html";
    location.replace(destination);
  }

  document.addEventListener("DOMContentLoaded", () => {
    const loginForm = document.getElementById("login-form");
    const registerForm = document.getElementById("register-form");

    if (loginForm) {
      loginForm.addEventListener("submit", async (event) => {
        event.preventDefault();
        if (!loginForm.reportValidity()) return;
        const submit = loginForm.querySelector('[type="submit"]');
        submit.disabled = true;
        submit.textContent = "Signing in…";
        try {
          const result = await api.login(Object.fromEntries(new FormData(loginForm).entries()));
          api.saveSession(result.data.token);
          redirectAfterAuthentication();
        } catch (error) {
          api.showToast(error.message, true);
        } finally {
          submit.disabled = false;
          submit.textContent = "Sign in";
        }
      });
    }

    if (registerForm) {
      registerForm.addEventListener("submit", async (event) => {
        event.preventDefault();
        if (!registerForm.reportValidity()) return;
        const submit = registerForm.querySelector('[type="submit"]');
        submit.disabled = true;
        submit.textContent = "Creating account…";
        try {
          const result = await api.register(Object.fromEntries(new FormData(registerForm).entries()));
          api.saveSession(result.data.token);
          redirectAfterAuthentication();
        } catch (error) {
          api.showToast(error.message, true);
        } finally {
          submit.disabled = false;
          submit.textContent = "Create account";
        }
      });
    }
  });
})();
