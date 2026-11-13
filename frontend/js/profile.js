(function () {
  "use strict";
  const api = window.StudyFlow;
  document.addEventListener("DOMContentLoaded", async () => {
    if (!(await api.ready)) return;
    document.getElementById("profile-name").value = api.user.name;
    document.getElementById("profile-email").value = api.user.email;
  }, { once: true });
})();
