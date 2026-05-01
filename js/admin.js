/* ========================================
   WHEATSTONE MAKERSPACE DASHBOARD
   Admin Panel Logic
   ======================================== */

(function () {
  "use strict";

  // ---- Default credentials ----
  const DEFAULT_USERNAME = "admin";
  const DEFAULT_PASSWORD = "wheatstone2026";

  const DEFAULTS = {
    slides: [
      {
        url: "assets/carousel_default_1.png",
        caption:
          "Welcome to the Wheatstone Makerspace — Build • Create • Innovate",
      },
      {
        url: "assets/carousel_default_2.png",
        caption:
          "Open to all KCL students — Mon-Fri • Macadam Building • Strand Campus",
      },
      {
        url: "assets/carousel_default_3.png",
        caption:
          "3D Printing • Laser Cutting • CNC — Equipment available for your projects",
      },
    ],
    statusMessages: [
      "Welcome to the Wheatstone Makerspace — Macadam Building, Strand Campus",
      "Remember: No food or drink allowed in the lab!",
      "Need help? Ask a Wheatstone Alliance committee member",
    ],
    events: [
      {
        name: "Intro to Soldering Workshop",
        date: "2026-05-08",
        time: "14:00 – 16:00",
        caption: "Learn the basics of soldering components",
        link: "https://kclsu.org",
      },
      {
        name: "Robotics Society Build Night",
        date: "2026-05-10",
        time: "18:00 – 21:00",
      },
      {
        name: "KCL Rocketry — Launch Prep",
        date: "2026-05-14",
        time: "15:00 – 18:00",
      },
      {
        name: "3D Printing Masterclass",
        date: "2026-05-17",
        time: "13:00 – 15:00",
      },
      {
        name: "Electronics Society Social",
        date: "2026-05-22",
        time: "19:00 – 22:00",
      },
    ],
    bbcEnabled: true,
    carouselInterval: 5000,
  };

  // ---- State ----
  let isLoggedIn = false;
  let remoteData = null;

  // ---- Storage helpers ----
  async function loadRemoteData() {
    try {
      const res = await fetch("/api/data?t=" + new Date().getTime(), {
        cache: "no-store",
      });
      if (res.ok) {
        remoteData = await res.json();
      } else {
        remoteData = JSON.parse(JSON.stringify(DEFAULTS));
      }
    } catch (e) {
      console.warn("Backend unavailable, using defaults");
      remoteData = JSON.parse(JSON.stringify(DEFAULTS));
    }
  }

  async function saveRemoteData() {
    try {
      const res = await fetch("/api/data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(remoteData),
      });
      if (!res.ok) {
        let errMsg = "Save failed";
        try {
          const errData = await res.json();
          if (errData.error) errMsg = errData.error;
        } catch (_) {}
        throw new Error(errMsg);
      }
    } catch (e) {
      console.error(e);
      showToast(e.message || "Failed to save to cloud database", "error");
    }
  }

  function getCredentials() {
    return (
      remoteData?.credentials || {
        username: DEFAULT_USERNAME,
        password: DEFAULT_PASSWORD,
      }
    );
  }
  function setCredentials(username, password) {
    remoteData.credentials = { username, password };
    saveRemoteData();
  }

  function getSlides() {
    return remoteData?.slides || DEFAULTS.slides;
  }
  function setSlides(slides) {
    remoteData.slides = slides;
    saveRemoteData();
  }

  function getHeadlines() {
    return remoteData?.statusUpdates || DEFAULTS.statusMessages;
  }
  function setHeadlines(headlines) {
    remoteData.statusUpdates = headlines;
    saveRemoteData();
  }

  function getEvents() {
    return remoteData?.events || DEFAULTS.events;
  }
  function setEvents(events) {
    remoteData.events = events;
    saveRemoteData();
  }

  function getBBCEnabled() {
    return remoteData?.bbcEnabled !== undefined
      ? remoteData.bbcEnabled
      : DEFAULTS.bbcEnabled;
  }
  function setBBCEnabled(enabled) {
    remoteData.bbcEnabled = enabled;
    saveRemoteData();
  }

  function getCarouselInterval() {
    return remoteData?.carouselInterval || DEFAULTS.carouselInterval;
  }
  function setCarouselInterval(interval) {
    remoteData.carouselInterval = interval;
    saveRemoteData();
  }

  // ---- Toast notifications ----
  function showToast(message, type = "success") {
    const existing = document.querySelector(".toast");
    if (existing) existing.remove();

    const toast = document.createElement("div");
    toast.className = `toast ${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);

    requestAnimationFrame(() => {
      toast.classList.add("show");
    });

    setTimeout(() => {
      toast.classList.remove("show");
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }

  // ---- Login ----
  function handleLogin(e) {
    e.preventDefault();

    const username = document.getElementById("login-username").value.trim();
    const password = document.getElementById("login-password").value;
    const errorEl = document.getElementById("login-error");
    const creds = getCredentials();

    if (username === creds.username && password === creds.password) {
      isLoggedIn = true;
      errorEl.classList.remove("show");
      sessionStorage.setItem("wheatstone_admin_session", "true");
      showAdminDashboard();
    } else {
      errorEl.textContent = "Invalid username or password";
      errorEl.classList.add("show");
    }
  }

  function handleLogout() {
    isLoggedIn = false;
    sessionStorage.removeItem("wheatstone_admin_session");
    document.getElementById("login-section").style.display = "";
    document.getElementById("admin-dashboard").classList.remove("active");
  }

  function showAdminDashboard() {
    document.getElementById("login-section").style.display = "none";
    document.getElementById("admin-dashboard").classList.add("active");
    loadCarouselEditor();
    loadHeadlinesEditor();
    loadEventsEditor();
    loadSettings();
  }

  // ---- Navigation ----
  function switchSection(sectionId) {
    document
      .querySelectorAll(".admin-section")
      .forEach((s) => s.classList.remove("active"));
    document
      .querySelectorAll(".admin-nav-btn")
      .forEach((b) => b.classList.remove("active"));

    document.getElementById(sectionId).classList.add("active");
    document
      .querySelector(`[data-section="${sectionId}"]`)
      .classList.add("active");
  }

  // ---- Carousel Editor ----
  function loadCarouselEditor() {
    const slides = getSlides();
    const listEl = document.getElementById("slides-list");
    listEl.innerHTML = "";

    if (slides.length === 0) {
      listEl.innerHTML =
        '<div class="empty-state"><div class="empty-icon">🖼️</div><p>No slides yet. Add your first slide below.</p></div>';
      return;
    }

    slides.forEach((slide, index) => {
      const item = document.createElement("div");
      item.className = "slide-item";
      item.innerHTML = `
        <img class="slide-preview" src="${slide.url}" alt="Slide ${index + 1}" onerror="this.style.background='var(--bg-tertiary)'">
        <div class="slide-info">
          <div class="slide-url">${slide.url}</div>
          <div class="slide-caption-text">${slide.caption || "No caption"}</div>
        </div>
        <div class="slide-actions">
          ${index > 0 ? `<button class="btn btn-secondary btn-icon" onclick="moveSlide(${index}, -1)" title="Move up">↑</button>` : ""}
          ${index < slides.length - 1 ? `<button class="btn btn-secondary btn-icon" onclick="moveSlide(${index}, 1)" title="Move down">↓</button>` : ""}
          <button class="btn btn-danger btn-icon" onclick="deleteSlide(${index})" title="Delete">✕</button>
        </div>
      `;
      listEl.appendChild(item);
    });
  }

  window.moveSlide = function (index, direction) {
    const slides = getSlides();
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= slides.length) return;

    const temp = slides[index];
    slides[index] = slides[newIndex];
    slides[newIndex] = temp;

    setSlides(slides);
    loadCarouselEditor();
    showToast("Slide reordered");
  };

  window.deleteSlide = function (index) {
    const slides = getSlides();
    slides.splice(index, 1);
    setSlides(slides);
    loadCarouselEditor();
    showToast("Slide deleted");
  };

  function handleAddSlide(e) {
    e.preventDefault();
    const urlInput = document.getElementById("new-slide-url");
    const captionInput = document.getElementById("new-slide-caption");

    const url = urlInput.value.trim();
    const caption = captionInput.value.trim();

    if (!url) {
      showToast("Please enter an image URL", "error");
      return;
    }

    const slides = getSlides();
    slides.push({ url, caption });
    setSlides(slides);

    urlInput.value = "";
    captionInput.value = "";
    document.getElementById("slide-preview-img").classList.remove("show");

    loadCarouselEditor();
    showToast("Slide added successfully");
  }

  // ---- Status Messages (formerly Headlines) Editor ----
  function loadHeadlinesEditor() {
    const headlines = getHeadlines();
    const listEl = document.getElementById("headlines-list");
    const bbcToggle = document.getElementById("bbc-toggle");
    listEl.innerHTML = "";

    bbcToggle.checked = getBBCEnabled();

    if (headlines.length === 0) {
      listEl.innerHTML =
        '<div class="empty-state"><div class="empty-icon">📢</div><p>No status messages. Add one below.</p></div>';
      return;
    }

    headlines.forEach((headline, index) => {
      const item = document.createElement("div");
      item.className = "headline-item";
      item.innerHTML = `
        <span class="headline-text">${headline}</span>
        <div class="headline-actions">
          ${index > 0 ? `<button class="btn btn-secondary btn-icon" onclick="moveHeadline(${index}, -1)" title="Move up">↑</button>` : ""}
          ${index < headlines.length - 1 ? `<button class="btn btn-secondary btn-icon" onclick="moveHeadline(${index}, 1)" title="Move down">↓</button>` : ""}
          <button class="btn btn-danger btn-icon" onclick="deleteHeadline(${index})" title="Delete">✕</button>
        </div>
      `;
      listEl.appendChild(item);
    });
  }

  window.moveHeadline = function (index, direction) {
    const headlines = getHeadlines();
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= headlines.length) return;

    const temp = headlines[index];
    headlines[index] = headlines[newIndex];
    headlines[newIndex] = temp;

    setHeadlines(headlines);
    loadHeadlinesEditor();
    showToast("Status message reordered");
  };

  window.deleteHeadline = function (index) {
    const headlines = getHeadlines();
    headlines.splice(index, 1);
    setHeadlines(headlines);
    loadHeadlinesEditor();
    showToast("Status message deleted");
  };

  function handleAddHeadline(e) {
    e.preventDefault();
    const input = document.getElementById("new-headline");
    const text = input.value.trim();

    if (!text) {
      showToast("Please enter a status message", "error");
      return;
    }

    const headlines = getHeadlines();
    headlines.push(text);
    setHeadlines(headlines);

    input.value = "";
    loadHeadlinesEditor();
    showToast("Status message added");
  }

  function handleBBCToggle() {
    const enabled = document.getElementById("bbc-toggle").checked;
    setBBCEnabled(enabled);
    showToast(enabled ? "BBC News enabled" : "BBC News disabled");
  }

  // ---- Events Editor ----
  const MONTH_SHORT = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  function loadEventsEditor() {
    const events = getEvents();
    const listEl = document.getElementById("events-list-admin");
    listEl.innerHTML = "";

    if (events.length === 0) {
      listEl.innerHTML =
        '<div class="empty-state"><div class="empty-icon">📅</div><p>No events yet. Add your first event below.</p></div>';
      return;
    }

    // Sort by date for display
    const sorted = events
      .map((e, i) => ({ ...e, _idx: i }))
      .sort((a, b) => new Date(a.date) - new Date(b.date));

    sorted.forEach((event) => {
      const d = new Date(event.date);
      const dateStr = `${d.getDate()} ${MONTH_SHORT[d.getMonth()]} ${d.getFullYear()}`;
      const item = document.createElement("div");
      item.className = "headline-item";
      const displayName =
        event.name.length > 40
          ? event.name.substring(0, 37) + "..."
          : event.name;

      item.innerHTML = `
        <span class="headline-text">
          <strong>${displayName}</strong>
          <br><small style="color:var(--text-muted)">${dateStr}${event.time ? " · " + event.time : ""}${event.caption ? " · " + event.caption : ""}${event.link ? " · [QR Link]" : ""}</small>
        </span>
        <div class="headline-actions">
          <button class="btn btn-danger btn-icon" onclick="deleteEvent(${event._idx})" title="Delete">✕</button>
        </div>
      `;
      listEl.appendChild(item);
    });
  }

  window.deleteEvent = function (index) {
    const events = getEvents();
    events.splice(index, 1);
    setEvents(events);
    loadEventsEditor();
    showToast("Event deleted");
  };

  function handleAddEvent(e) {
    e.preventDefault();
    const nameInput = document.getElementById("new-event-name");
    const dateInput = document.getElementById("new-event-date");
    const timeInput = document.getElementById("new-event-time");
    const captionInput = document.getElementById("new-event-caption");
    const linkInput = document.getElementById("new-event-link");

    const name = nameInput.value.trim().substring(0, 40);
    const date = dateInput.value;
    const time = timeInput.value.trim();
    const caption = captionInput.value.trim().substring(0, 30);
    const link = linkInput.value.trim();

    if (!name || !date) {
      showToast("Please enter event name and date", "error");
      return;
    }

    const events = getEvents();
    events.push({ name, date, time, caption, link });
    setEvents(events);

    nameInput.value = "";
    dateInput.value = "";
    timeInput.value = "";
    captionInput.value = "";
    linkInput.value = "";

    loadEventsEditor();
    showToast("Event added");
  }

  // ---- Settings ----
  function loadSettings() {
    const creds = getCredentials();
    const interval = getCarouselInterval();

    document.getElementById("settings-username").value = creds.username;
    document.getElementById("settings-password").value = "";
    document.getElementById("settings-interval").value = interval / 1000;
  }

  function handleSaveSettings(e) {
    e.preventDefault();

    const username = document.getElementById("settings-username").value.trim();
    const password = document.getElementById("settings-password").value;
    const intervalEl = document.getElementById("settings-interval");
    const interval = parseFloat(intervalEl.value);

    if (username) {
      const creds = getCredentials();
      const newPassword = password || creds.password;
      setCredentials(username, newPassword);
    }

    if (!isNaN(interval) && interval >= 1) {
      setCarouselInterval(Math.round(interval * 1000));
    }

    showToast("Settings saved");
    loadSettings();
  }

  function handleResetAll() {
    if (
      confirm(
        "Are you sure you want to reset ALL settings to defaults? This cannot be undone.",
      )
    ) {
      localStorage.removeItem("wheatstone_slides");
      localStorage.removeItem("wheatstone_headlines");
      localStorage.removeItem("wheatstone_events");
      localStorage.removeItem("wheatstone_bbc_enabled");
      localStorage.removeItem("wheatstone_carousel_interval");
      localStorage.removeItem("wheatstone_credentials");

      loadCarouselEditor();
      loadHeadlinesEditor();
      loadEventsEditor();
      loadSettings();
      showToast("All settings reset to defaults");
    }
  }

  // ---- Image preview on URL input ----
  function handleSlideUrlPreview() {
    const url = document.getElementById("new-slide-url").value.trim();
    const preview = document.getElementById("slide-preview-img");

    if (url) {
      preview.src = url;
      preview.classList.add("show");
      preview.onerror = () => preview.classList.remove("show");
    } else {
      preview.classList.remove("show");
    }
  }

  // ---- Init ----
  document.addEventListener("DOMContentLoaded", async () => {
    await loadRemoteData();

    // Check for existing session
    if (sessionStorage.getItem("wheatstone_admin_session") === "true") {
      isLoggedIn = true;
      showAdminDashboard();
    }

    // Login form
    const loginForm = document.getElementById("login-form");
    if (loginForm) loginForm.addEventListener("submit", handleLogin);

    // Logout
    const logoutBtn = document.getElementById("logout-btn");
    if (logoutBtn) logoutBtn.addEventListener("click", handleLogout);

    // Navigation
    document.querySelectorAll(".admin-nav-btn").forEach((btn) => {
      btn.addEventListener("click", () => switchSection(btn.dataset.section));
    });

    // Drag and Drop
    const dropzone = document.getElementById("slide-dropzone");
    const fileInput = document.getElementById("new-slide-file");
    const urlInput = document.getElementById("new-slide-url");

    if (dropzone && fileInput) {
      dropzone.addEventListener("click", () => fileInput.click());

      dropzone.addEventListener("dragover", (e) => {
        e.preventDefault();
        dropzone.classList.add("dragover");
      });

      dropzone.addEventListener("dragleave", () => {
        dropzone.classList.remove("dragover");
      });

      dropzone.addEventListener("drop", (e) => {
        e.preventDefault();
        dropzone.classList.remove("dragover");
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
          handleFile(e.dataTransfer.files[0]);
        }
      });

      fileInput.addEventListener("change", (e) => {
        if (e.target.files && e.target.files[0]) {
          handleFile(e.target.files[0]);
        }
      });

      function handleFile(file) {
        if (!file.type.startsWith("image/")) {
          showToast("Please upload an image file", "error");
          return;
        }
        // Base64 limit check (localStorage is ~5MB)
        if (file.size > 2 * 1024 * 1024) {
          showToast("File is too large (max 2MB)", "error");
          return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
          urlInput.value = e.target.result;
          const event = new Event("input", { bubbles: true });
          urlInput.dispatchEvent(event);
          showToast("Image loaded");
        };
        reader.readAsDataURL(file);
      }
    }

    // Add slide
    const addSlideBtn = document.getElementById("add-slide-btn");
    if (addSlideBtn) addSlideBtn.addEventListener("click", handleAddSlide);

    // Slide URL preview
    const slideUrlInput = document.getElementById("new-slide-url");
    if (slideUrlInput) {
      slideUrlInput.addEventListener("input", handleSlideUrlPreview);
      slideUrlInput.addEventListener("change", handleSlideUrlPreview);
    }

    // Add headline / status message
    const addHeadlineBtn = document.getElementById("add-headline-btn");
    if (addHeadlineBtn)
      addHeadlineBtn.addEventListener("click", handleAddHeadline);

    // BBC toggle
    const bbcToggle = document.getElementById("bbc-toggle");
    if (bbcToggle) bbcToggle.addEventListener("change", handleBBCToggle);

    // Add event
    const addEventBtn = document.getElementById("add-event-btn");
    if (addEventBtn) addEventBtn.addEventListener("click", handleAddEvent);

    // Settings
    const saveSettingsBtn = document.getElementById("save-settings-btn");
    if (saveSettingsBtn)
      saveSettingsBtn.addEventListener("click", handleSaveSettings);

    const resetBtn = document.getElementById("reset-all-btn");
    if (resetBtn) resetBtn.addEventListener("click", handleResetAll);

    // View dashboard link
    const viewDashBtn = document.getElementById("view-dashboard-btn");
    if (viewDashBtn)
      viewDashBtn.addEventListener("click", () =>
        window.open("https://wheatpi.vercel.app", "_blank"),
      );
  });
})();
