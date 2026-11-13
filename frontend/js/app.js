(function () {
  "use strict";

  const TOKEN_KEY = "studyflow.session.token";
  const API_BASE = document.querySelector('meta[name="api-base-url"]')?.content || "http://localhost:3000/api";
  const publicPages = new Set(["login.html", "register.html"]);
  let token = sessionStorage.getItem(TOKEN_KEY);
  let user = null;
  let tasks = [];
  let dashboard = null;
  let initialized = false;

  function dateOnly(date) {
    return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}-${String(date.getUTCDate()).padStart(2, "0")}`;
  }

  function normalizeTask(task) {
    return {
      ...task,
      id: String(task._id || task.id),
      priority: task.priority || "Medium",
      startDate: typeof task.startDate === "string" ? task.startDate.slice(0, 10) : dateOnly(new Date(task.startDate)),
      deadline: typeof task.deadline === "string" ? task.deadline.slice(0, 10) : dateOnly(new Date(task.deadline))
    };
  }

  function escapeHtml(value) {
    return String(value == null ? "" : value).replace(/[&<>"']/g, (char) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    })[char]);
  }

  function showToast(message, isError) {
    const region = document.getElementById("toast-region");
    if (!region) return;
    const toast = document.createElement("div");
    toast.className = `toast${isError ? " error" : ""}`;
    toast.textContent = message;
    region.appendChild(toast);
    window.setTimeout(() => toast.remove(), 4500);
  }

  async function request(path, options) {
    const requestOptions = options || {};
    const headers = new Headers(requestOptions.headers || {});
    if (requestOptions.body && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");
    if (token) headers.set("Authorization", `Bearer ${token}`);

    let response;
    try {
      response = await fetch(`${API_BASE}${path}`, { ...requestOptions, headers });
    } catch (error) {
      throw new Error("Cannot reach the StudyFlow API. Start the backend and check its configured address.");
    }

    let result;
    try {
      result = await response.json();
    } catch (error) {
      throw new Error("The API returned an invalid response.");
    }

    if (response.status === 401 && token) {
      clearSession();
      if (!publicPages.has(currentPage())) location.replace("login.html");
    }
    if (!response.ok || result.success === false) {
      const validationErrors = Array.isArray(result.errors) ? ` ${result.errors.map((item) => item.message).join(" ")}` : "";
      throw new Error(`${result.message || `Request failed (${response.status}).`}${validationErrors}`);
    }
    return result;
  }

  function currentPage() {
    return location.pathname.split("/").pop() || "index.html";
  }

  function clearSession() {
    sessionStorage.removeItem(TOKEN_KEY);
    token = null;
    user = null;
  }

  function redirectToLogin() {
    const next = `${currentPage()}${location.hash}`;
    location.replace(`login.html?next=${encodeURIComponent(next)}`);
  }

  function renderNavigation() {
    if (!user) return;
    const links = document.querySelectorAll(".nav-link");
    const page = currentPage();
    links.forEach((link) => {
      if (link.getAttribute("href") === page) link.classList.add("active");
    });
    document.querySelectorAll("[data-user-name]").forEach((el) => { el.textContent = user.name; });
    document.querySelectorAll("[data-user-email]").forEach((el) => { el.textContent = user.email; });
    document.querySelectorAll(".sidebar-user-meta").forEach((el) => { el.textContent = "Student account"; });
    document.querySelectorAll("[data-user-initials]").forEach((el) => {
      el.textContent = user.name.split(/\s+/).map((part) => part[0]).slice(0, 2).join("").toUpperCase();
    });
    updateNotificationCount();
  }

  function resetIdentityPlaceholders() {
    document.querySelectorAll("[data-user-name]").forEach((el) => { el.textContent = "Student"; });
    document.querySelectorAll("[data-user-email]").forEach((el) => { el.textContent = ""; });
    document.querySelectorAll("[data-user-initials]").forEach((el) => { el.textContent = "?"; });
    document.querySelectorAll(".sidebar-user-meta").forEach((el) => { el.textContent = "Checking account…"; });
  }

  function updateNotificationCount() {
    const alertCount = tasks.filter((task) =>
      task.status !== "Completed" && task.deadline <= dateOnly(new Date(Date.now() + 3 * 24 * 60 * 60 * 1000))
    ).length;
    document.querySelectorAll("[data-notification-count]").forEach((el) => {
      el.textContent = alertCount;
      el.hidden = alertCount === 0;
    });
    document.querySelectorAll(".notification-dot").forEach((el) => {
      el.hidden = alertCount === 0;
    });
  }

  async function fetchAllTasks() {
    const allTasks = [];
    let page = 1;
    let pages = 1;
    do {
      const result = await request(`/tasks?page=${page}&limit=100`);
      allTasks.push(...result.data.tasks.map(normalizeTask));
      pages = result.data.pagination.pages;
      page += 1;
    } while (page <= pages);
    tasks = allTasks;
    updateNotificationCount();
    window.dispatchEvent(new CustomEvent("studyflow:tasks-changed"));
    return tasks.slice();
  }

  async function refreshDashboard() {
    const result = await request("/dashboard/stats");
    dashboard = {
      ...result.data,
      recentTasks: result.data.recentTasks.map(normalizeTask),
      upcomingDeadlines: result.data.upcomingDeadlines.map(normalizeTask)
    };
    window.dispatchEvent(new CustomEvent("studyflow:dashboard-changed"));
    return dashboard;
  }

  async function initialize() {
    document.querySelectorAll(".preview-banner").forEach((banner) => banner.remove());
    resetIdentityPlaceholders();
    const page = currentPage();
    if (publicPages.has(page)) {
      if (token) {
        try {
          const result = await request("/auth/me");
          user = result.data.user;
          location.replace("dashboard.html");
          return false;
        } catch (error) {
          if (token) showToast(error.message, true);
        }
      }
      initialized = true;
      return true;
    }

    if (!token) {
      redirectToLogin();
      return false;
    }

    try {
      const result = await request("/auth/me");
      user = result.data.user;
      initialized = true;
      renderNavigation();
      return true;
    } catch (error) {
      showToast(error.message, true);
      if (token) return false;
      return false;
    }
  }

  const ready = new Promise((resolve) => {
    document.addEventListener("DOMContentLoaded", async () => {
      renderNavigation();
      document.querySelectorAll("[data-mobile-menu]").forEach((button) => {
        button.addEventListener("click", () => document.querySelector(".sidebar")?.classList.toggle("open"));
      });
      document.querySelectorAll("[data-notifications-link]").forEach((button) => {
        button.addEventListener("click", () => { location.href = "notifications.html"; });
      });
      document.querySelectorAll("[data-logout]").forEach((button) => {
        button.addEventListener("click", () => {
          clearSession();
          location.replace("login.html");
        });
      });
      resolve(await initialize());
    }, { once: true });
  });

  function formatDate(value, options) {
    if (!value) return "No date";
    const parsed = new Date(`${String(value).slice(0, 10)}T00:00:00`);
    return Number.isNaN(parsed.getTime()) ? "No date" : parsed.toLocaleDateString(undefined, options || { month: "short", day: "numeric" });
  }

  function statusClass(task) {
    if (task.status !== "Completed" && task.deadline < dateOnly(new Date())) return "status-overdue";
    return `status-${task.status.toLowerCase().replace(/\s+/g, "-")}`;
  }

  function getStats() {
    if (dashboard?.stats) return {
      total: dashboard.stats.total,
      completed: dashboard.stats.completed,
      pending: dashboard.stats.pending + dashboard.stats.inProgress,
      inProgress: dashboard.stats.inProgress,
      overdue: dashboard.stats.overdue,
      dueToday: dashboard.stats.dueToday,
      percent: dashboard.stats.progress
    };
    const today = dateOnly(new Date());
    const completed = tasks.filter((task) => task.status === "Completed").length;
    return {
      total: tasks.length,
      completed,
      pending: tasks.filter((task) => task.status === "Pending" || task.status === "In Progress").length,
      overdue: tasks.filter((task) => task.status !== "Completed" && task.deadline < today).length,
      dueToday: tasks.filter((task) => task.status !== "Completed" && task.deadline === today).length,
      percent: tasks.length ? Math.round((completed / tasks.length) * 100) : 0
    };
  }

  async function mutateTask(method, path, body) {
    const result = await request(path, {
      method,
      ...(body === undefined ? {} : { body: JSON.stringify(body) })
    });
    await Promise.all([fetchAllTasks(), refreshDashboard()]);
    return result.data?.task ? normalizeTask(result.data.task) : result.data;
  }

  window.StudyFlow = {
    get ready() { return ready; },
    get initialized() { return initialized; },
    get tasks() { return tasks.slice(); },
    get user() { return user; },
    get dashboard() { return dashboard; },
    get hasToken() { return Boolean(token); },
    request,
    fetchAllTasks,
    refreshDashboard,
    register: (body) => request("/auth/register", { method: "POST", body: JSON.stringify(body) }),
    login: (body) => request("/auth/login", { method: "POST", body: JSON.stringify(body) }),
    saveSession(nextToken) {
      token = nextToken;
      sessionStorage.setItem(TOKEN_KEY, nextToken);
    },
    clearSession,
    createTask: (body) => mutateTask("POST", "/tasks", body),
    updateTask: (id, body) => mutateTask("PUT", `/tasks/${encodeURIComponent(id)}`, body),
    updateTaskStatus: (id, status) => mutateTask("PUT", `/tasks/${encodeURIComponent(id)}/status`, { status }),
    deleteTask: (id) => mutateTask("DELETE", `/tasks/${encodeURIComponent(id)}`),
    getStats,
    escapeHtml,
    showToast,
    formatDate,
    statusClass,
    today: () => dateOnly(new Date()),
    addDays(count) {
      const date = new Date();
      date.setUTCDate(date.getUTCDate() + count);
      return dateOnly(date);
    }
  };
})();
