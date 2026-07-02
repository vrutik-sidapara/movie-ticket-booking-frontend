/* ═══════════════════════════════════════
   CINEBOOK — SHARED JS
   All API calls, auth, toast, nav
═══════════════════════════════════════ */

const BASE_URL = "https://cinebook-app.onrender.com/api";

// ──────────────────────────────────────
// AUTH STATE
// ──────────────────────────────────────
const Auth = {
  get() {
    try {
      return JSON.parse(localStorage.getItem("cb_auth") || "null");
    } catch {
      return null;
    }
  },
  set(data) {
    localStorage.setItem("cb_auth", JSON.stringify(data));
  },
  clear() {
    localStorage.removeItem("cb_auth");
  },
  token() {
    return this.get()?.token || null;
  },
  user() {
    return this.get()?.user || null;
  },
  isLoggedIn() {
    return !!this.token();
  },
  role() {
    return this.get()?.user?.role || "user";
  },
  isAdmin() {
    return ["admin", "superadmin"].includes(this.role());
  },
  isSuperAdmin() {
    return this.role() === "superadmin";
  },
};

// ──────────────────────────────────────
// API HELPER
// ──────────────────────────────────────
async function api(method, endpoint, body = null, isForm = false) {
  const headers = {};
  const tok = Auth.token();
  if (tok) headers["Authorization"] = `Bearer ${tok}`;
  if (!isForm) headers["Content-Type"] = "application/json";

  const opts = { method, headers };
  if (body) opts.body = isForm ? body : JSON.stringify(body);

  try {
    const res = await fetch(`${BASE_URL}${endpoint}`, opts);
    let data;
    try {
      data = await res.json();
    } catch {
      data = {};
    }
    if (!res.ok)
      throw new Error(data.message || data.error || `HTTP ${res.status}`);
    return { ok: true, data };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

// ──────────────────────────────────────
// TOAST
// ──────────────────────────────────────
function showToast(msg, type = "info") {
  const root = document.getElementById("toast-root");
  if (!root) return;
  const t = document.createElement("div");
  t.className = `toast toast-${type}`;
  const icons = { success: "✓", error: "✕", info: "ℹ" };
  t.innerHTML = `<span style="font-weight:800;font-size:16px">${icons[type] || "ℹ"}</span><span>${msg}</span>`;
  root.appendChild(t);
  setTimeout(() => t.remove(), 3200);
}

// ──────────────────────────────────────
// SPINNER HELPER
// ──────────────────────────────────────
function setLoading(btnId, loading, label = null) {
  const btn =
    typeof btnId === "string" ? document.getElementById(btnId) : btnId;
  if (!btn) return;
  if (loading) {
    btn._origHTML = btn.innerHTML;
    btn.innerHTML = `<span class="spinner"></span> ${label || "Loading..."}`;
    btn.disabled = true;
  } else {
    btn.innerHTML = btn._origHTML || btn.innerHTML;
    btn.disabled = false;
  }
}

// ──────────────────────────────────────
// NAV RENDERING
// ──────────────────────────────────────
function renderNav() {
  const navRight = document.getElementById("navRight");
  if (!navRight) return;

  if (Auth.isLoggedIn()) {
    const u = Auth.user();
    const name = u?.name || u?.email?.split("@")[0] || "User";
    const initial = name[0].toUpperCase();
    const role = Auth.role();

    let dashLink = "";
    if (Auth.isSuperAdmin()) {
      dashLink = `<a href="superadmin.html" class="nav-dash-btn">👑 Super Admin</a>`;
    } else if (Auth.isAdmin()) {
      dashLink = `<a href="admin.html" class="nav-dash-btn">⚙ Admin</a>`;
    }

    navRight.innerHTML = `
      ${dashLink}
      <div class="nav-user-chip" onclick="handleLogout()">
        <div class="nav-avatar">${initial}</div>
        <div>
          <div class="nav-user-name">${name}</div>
          <div class="nav-user-role">${role}</div>
        </div>
        <span style="color:var(--muted);font-size:12px;margin-left:4px">Logout</span>
      </div>
    `;

    // ✅ AA NEW CODE ADD KARO — Mobile menu admin button
    const mobileAdminSlot = document.getElementById("mobileAdminBtn");
    if (mobileAdminSlot) {
      if (Auth.isSuperAdmin()) {
        mobileAdminSlot.innerHTML = `
          <a class="nav-mobile-link" href="superadmin.html" style="color:var(--red);border-color:rgba(220,30,30,0.3);">
            👑 Super Admin Dashboard
          </a>
          <div class="nav-mobile-divider"></div>
        `;
      } else if (Auth.isAdmin()) {
        mobileAdminSlot.innerHTML = `
          <a class="nav-mobile-link" href="admin.html" style="color:var(--red);border-color:rgba(220,30,30,0.3);">
            ⚙️ Admin Dashboard
          </a>
          <div class="nav-mobile-divider"></div>
        `;
      } else {
        mobileAdminSlot.innerHTML = "";
      }
    }
  } else {
    navRight.innerHTML = `
      <button class="btn btn-ghost btn-sm" onclick="openAuthModal('login')">Sign In</button>
      <button class="btn btn-red btn-sm" onclick="openAuthModal('register')">Register Free</button>
    `;
  }
}

// ──────────────────────────────────────
// AUTH MODAL
// ──────────────────────────────────────
function openAuthModal(tab = "login") {
  // Remove existing
  const existing = document.getElementById("__authModal");
  if (existing) existing.remove();

  const overlay = document.createElement("div");
  overlay.className = "modal-overlay";
  overlay.id = "__authModal";
  overlay.innerHTML = `
    <div class="modal-box" onclick="event.stopPropagation()">
      <button class="modal-close-btn" onclick="closeAuthModal()">✕</button>
      <div class="modal-title">Welcome to CineBook</div>
      <div class="modal-subtitle">Sign in to book tickets and manage your account</div>
      <div class="auth-tabs">
        <div class="auth-tab ${tab === "login" ? "active" : ""}" id="authTabLogin" onclick="switchAuthTab('login')">Sign In</div>
        <div class="auth-tab ${tab === "register" ? "active" : ""}" id="authTabReg" onclick="switchAuthTab('register')">Create Account</div>
      </div>

      <!-- LOGIN -->
      <div id="authFormLogin" style="display:${tab === "login" ? "block" : "none"}">
        <div class="form-group">
          <label class="form-label">Email Address</label>
          <div class="input-icon-wrap">
            <span class="input-icon">✉</span>
            <input type="email" id="loginEmail" class="form-input" placeholder="you@example.com" autocomplete="email"/>
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Password</label>
          <div class="input-icon-wrap">
            <span class="input-icon">🔒</span>
            <input type="password" id="loginPass" class="form-input" placeholder="••••••••" autocomplete="current-password"/>
          </div>
        </div>
        <button class="btn-submit" id="loginSubmitBtn" onclick="doLogin()">SIGN IN →</button>
  
        <p id="resendVerifyWrap" style="display:none;font-size:13px;color:var(--muted);margin-top:14px;text-align:center">
        Didn't get the email?
        <a href="#" id="resendVerifyLink" onclick="doResendVerification(event)" style="color:var(--red);font-weight:600;text-decoration:none">Resend verification email</a>
        </p>
      </div>

      <!-- REGISTER -->
      <div id="authFormReg" style="display:${tab === "register" ? "block" : "none"}">
        <div class="form-group">
          <label class="form-label">Full Name</label>
          <input type="text" id="regName" class="form-input" placeholder="John Doe"/>
        </div>
        <div class="form-group">
          <label class="form-label">Email Address</label>
          <input type="email" id="regEmail" class="form-input" placeholder="you@example.com"/>
        </div>
        <div class="form-group">
          <label class="form-label">Password</label>
          <input type="password" id="regPass" class="form-input" placeholder="Min 8 characters"/>
        </div>
        <div class="form-group">
        <label class="form-label">Confirm Password</label>
        <input type="password" id="regConfirmPass" class="form-input" placeholder="Confirm your password"/>
        </div>
        <button class="btn-submit" id="regSubmitBtn" onclick="doRegister()">CREATE ACCOUNT →</button>
        <p style="font-size:12px;color:var(--muted);margin-top:12px;text-align:center">
          A verification email will be sent to your inbox.
        </p>
      </div>
    </div>
  `;

  overlay.addEventListener("click", closeAuthModal);
  document.body.appendChild(overlay);

  // focus first field
  setTimeout(() => {
    const f = overlay.querySelector("input");
    if (f) f.focus();
  }, 100);
}

function closeAuthModal() {
  const m = document.getElementById("__authModal");
  if (m) m.remove();
}

function switchAuthTab(tab) {
  document
    .getElementById("authTabLogin")
    .classList.toggle("active", tab === "login");
  document
    .getElementById("authTabReg")
    .classList.toggle("active", tab === "register");
  document.getElementById("authFormLogin").style.display =
    tab === "login" ? "block" : "none";
  document.getElementById("authFormReg").style.display =
    tab === "register" ? "block" : "none";
}

async function doLogin() {
  const email = document.getElementById("loginEmail")?.value?.trim();
  const password = document.getElementById("loginPass")?.value;
  if (!email || !password) {
    showToast("Please fill all fields", "error");
    return;
  }

  const resendWrap = document.getElementById("resendVerifyWrap");
  if (resendWrap) resendWrap.style.display = "none";

  setLoading("loginSubmitBtn", true, "Signing in...");
  const r = await api("POST", "/auth/login", { email, password });
  setLoading("loginSubmitBtn", false);

  if (r.ok) {
    Auth.set({
      token: r.data.token,
      user: {
        name: r.data.user.username,
        email: r.data.user.email,
        role: r.data.user.role,
        id: r.data.user.id,
      },
    });
    closeAuthModal();
    showToast(`Welcome back, ${r.data.user.username}! 🎬`, "success");
    renderNav();
    setTimeout(() => window.location.reload(), 500);
  } else {
    showToast(r.error || "Login failed", "error");

    if (r.error && r.error.toLowerCase().includes("verify") && resendWrap) {
      resendWrap.style.display = "block";
      resendWrap.dataset.email = email;
    }
  }
}

async function doResendVerification(e) {
  e.preventDefault();
  const resendWrap = document.getElementById("resendVerifyWrap");
  const email = resendWrap?.dataset.email;

  if (!email) {
    showToast("Please enter your email first", "error");
    return;
  }

  const link = document.getElementById("resendVerifyLink");
  const originalText = link.textContent;
  link.textContent = "Sending...";

  const r = await api("POST", "/auth/resend-verification", { email });

  link.textContent = originalText;

  if (r.ok) {
    showToast("Verification email sent! Check your inbox 📧", "success");
    resendWrap.style.display = "none";
  } else {
    showToast(r.error || "Failed to resend email", "error");
  }
}

async function doRegister() {
  const username = document.getElementById("regName")?.value?.trim();
  const email = document.getElementById("regEmail")?.value?.trim();
  const password = document.getElementById("regPass")?.value;
  const confirmPass = document.getElementById("regConfirmPass")?.value;

  if (!username || !email || !password || !confirmPass) {
    showToast("Please fill all fields", "error");
    return;
  }

  if (password !== confirmPass) {
    showToast("Passwords do not match", "error");
    return;
  }

  if (password.length < 8) {
    showToast("Password must be at least 8 characters", "error");
    return;
  }

  setLoading("regSubmitBtn", true, "Creating account...");
  const r = await api("POST", "/auth/register", {
    username, // ✅ matches backend expects "username"
    email,
    password,
    role: "user",
  });
  setLoading("regSubmitBtn", false);

  if (r.ok) {
    // ✅ Backend returns token = verification token, log it for dev
    console.log(
      `✅ Verify URL: http://localhost:3003/api/auth/verify?token=${r.data.token}`,
    );
    showToast("Account created! Check your email to verify 📧", "success");
    switchAuthTab("login");

    // ✅ Pre-fill email on login tab for convenience
    setTimeout(() => {
      const loginEmail = document.getElementById("loginEmail");
      if (loginEmail) loginEmail.value = email;
    }, 100);
  } else {
    showToast(r.error || "Registration failed", "error");
  }
}

function handleLogout() {
  Auth.clear();
  showToast("Logged out. See you soon! 👋", "info");
  renderNav();
  setTimeout(() => (window.location.href = "index.html"), 600);
}

// ──────────────────────────────────────
// DASHBOARD PANEL SWITCHER
// ──────────────────────────────────────
function switchPanel(panelId, clickedEl) {
  // Panels
  document
    .querySelectorAll(".dash-panel")
    .forEach((p) => p.classList.remove("active"));
  const target = document.getElementById(panelId);
  if (target) target.classList.add("active");

  // Nav items
  const sidebar = clickedEl?.closest(".dash-sidebar");
  if (sidebar) {
    sidebar
      .querySelectorAll(".dash-nav-item")
      .forEach((i) => i.classList.remove("active"));
    clickedEl.classList.add("active");
  }
}

// ──────────────────────────────────────
// FILE UPLOAD UI
// ──────────────────────────────────────
function setupFileDrop(dropId, inputId, labelId) {
  const drop = document.getElementById(dropId);
  const input = document.getElementById(inputId);
  if (!drop || !input) return;

  drop.addEventListener("click", () => input.click());
  input.addEventListener("change", () => {
    const f = input.files[0];
    const label = document.getElementById(labelId);
    if (label && f) label.textContent = `✓ ${f.name}`;
  });

  drop.addEventListener("dragover", (e) => {
    e.preventDefault();
    drop.style.borderColor = "var(--red)";
  });
  drop.addEventListener("dragleave", () => {
    drop.style.borderColor = "";
  });
  drop.addEventListener("drop", (e) => {
    e.preventDefault();
    drop.style.borderColor = "";
    if (e.dataTransfer.files[0]) {
      const dt = new DataTransfer();
      dt.items.add(e.dataTransfer.files[0]);
      input.files = dt.files;
      const label = document.getElementById(labelId);
      if (label) label.textContent = `✓ ${e.dataTransfer.files[0].name}`;
    }
  });
}

// ──────────────────────────────────────
// CONFIRM DIALOG
// ──────────────────────────────────────
function confirmAction(msg, cb) {
  const overlay = document.createElement("div");
  overlay.className = "modal-overlay";
  overlay.innerHTML = `
    <div class="modal-box" style="max-width:380px" onclick="event.stopPropagation()">
      <div class="modal-title" style="font-size:24px">Confirm Action</div>
      <p style="color:var(--muted);font-size:15px;margin:12px 0 28px">${msg}</p>
      <div style="display:flex;gap:12px">
        <button class="btn-submit" style="background:var(--red);flex:1" onclick="document.body.removeChild(this.closest('.modal-overlay'));cb_confirm()">Confirm</button>
        <button class="btn btn-ghost btn-sm" style="flex:1" onclick="document.body.removeChild(this.closest('.modal-overlay'))">Cancel</button>
      </div>
    </div>
  `;
  window.cb_confirm = () => {
    cb();
  };
  overlay.addEventListener("click", () => document.body.removeChild(overlay));
  document.body.appendChild(overlay);
}

// ──────────────────────────────────────
// DATE HELPER
// ──────────────────────────────────────
function todayISO() {
  return new Date().toISOString().split("T")[0];
}
function fmtDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

// ──────────────────────────────────────
// INIT (call from each page)
// ──────────────────────────────────────
function initShared() {
  // Auth guard for dashboard pages
  const path = window.location.pathname;
  if (path.includes("admin.html") && !Auth.isAdmin()) {
    showToast("Admin access required", "error");
    window.location.href = "index.html";
    return;
  }
  if (path.includes("superadmin.html") && !Auth.isSuperAdmin()) {
    showToast("Super Admin access required", "error");
    window.location.href = "index.html";
    return;
  }

  // ✅ Auto-logout when JWT expires (24h)
  checkTokenExpiry();
}

function checkTokenExpiry() {
  const token = Auth.token();
  if (!token) return;

  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    const expiryTime = payload.exp * 1000;
    const now = Date.now();

    if (now >= expiryTime) {
      Auth.clear();
      showToast("Session expired. Please login again.", "info");
      renderNav();
      return;
    }

    const timeRemaining = expiryTime - now;
    setTimeout(() => {
      Auth.clear();
      showToast("Session expired. Please login again.", "info");
      renderNav();
      if (
        window.location.pathname.includes("admin.html") ||
        window.location.pathname.includes("superadmin.html")
      ) {
        window.location.href = "index.html";
      }
    }, timeRemaining);
  } catch (err) {
    Auth.clear();
  }
}
