/* =========================================================
   Hidden Yeongdo – main script (vanilla JavaScript, no libraries
   except Leaflet for the map on gallery.html)

   Every feature first checks if its element exists on the page,
   so this one file can be loaded on all five pages.
   1. Mobile menu   2. (removed)   3. Footer year
   4. Itinerary timeline   5. Gallery filter   6. Lightbox
   7. OpenStreetMap   8. Contact form validation   9. Sunset time
   10. Trip overview tabs
   ========================================================= */

document.addEventListener("DOMContentLoaded", function () {
  setupMenu();
  setupYear();
  setupTimeline();
  setupGalleryFilter();
  setupLightbox();
  setupMap();
  setupContactForm();
  setupSunset();
  setupTabs();
});

/* ---------- 1. Mobile menu (☰ button) ---------- */
function setupMenu() {
  const btn = document.querySelector(".menu-btn");
  const links = document.querySelector(".nav-links");
  if (!btn || !links) return;

  btn.addEventListener("click", function () {
    links.classList.toggle("open");
    // tell screen readers whether the menu is open
    btn.setAttribute("aria-expanded", links.classList.contains("open"));
  });
}

/* ---------- 3. Footer year ---------- */
function setupYear() {
  const el = document.getElementById("year");
  if (el) el.textContent = new Date().getFullYear();
}

/* ---------- 4. Itinerary timeline: click a stop to open its details ---------- */
function setupTimeline() {
  document.querySelectorAll(".stop-toggle").forEach(function (button) {
    button.addEventListener("click", function () {
      const stop = button.parentElement;
      stop.classList.toggle("open");
      button.setAttribute("aria-expanded", stop.classList.contains("open"));
    });
  });
}

/* ---------- 5. Gallery filter buttons ---------- */
function setupGalleryFilter() {
  const buttons = document.querySelectorAll(".filter-btn");
  const items = document.querySelectorAll(".gallery-item");
  if (!buttons.length) return;

  buttons.forEach(function (btn) {
    btn.addEventListener("click", function () {
      buttons.forEach(function (b) { b.classList.remove("active"); });
      btn.classList.add("active");

      const filter = btn.dataset.filter; // "all", "coast", "mountain", "beach"
      items.forEach(function (item) {
        const show = filter === "all" || item.dataset.place === filter;
        item.classList.toggle("hide", !show);
      });
    });
  });
}

/* ---------- 6. Lightbox (full-screen photo viewer) ---------- */
function setupLightbox() {
  const box = document.querySelector(".lightbox");
  if (!box) return;
  const img = box.querySelector("img");
  const caption = box.querySelector("p");
  let current = 0;

  // only the photos that are visible right now (after filtering)
  function visibleItems() {
    return Array.from(document.querySelectorAll(".gallery-item:not(.hide)"));
  }

  function show(index) {
    const items = visibleItems();
    current = (index + items.length) % items.length; // wrap around
    const photo = items[current].querySelector("img");
    img.src = photo.src;
    img.alt = photo.alt;
    caption.textContent = photo.alt;
  }

  document.querySelectorAll(".gallery-item").forEach(function (item) {
    item.addEventListener("click", function () {
      show(visibleItems().indexOf(item));
      box.classList.add("open");
    });
  });

  box.querySelector(".lb-close").addEventListener("click", close);
  box.querySelector(".lb-prev").addEventListener("click", function () { show(current - 1); });
  box.querySelector(".lb-next").addEventListener("click", function () { show(current + 1); });
  box.addEventListener("click", function (e) { if (e.target === box) close(); });

  // keyboard: Esc closes, arrows move
  document.addEventListener("keydown", function (e) {
    if (!box.classList.contains("open")) return;
    if (e.key === "Escape") close();
    if (e.key === "ArrowLeft") show(current - 1);
    if (e.key === "ArrowRight") show(current + 1);
  });

  function close() { box.classList.remove("open"); }
}

/* ---------- 7. OpenStreetMap with Leaflet ----------
   Leaflet is loaded from a CDN in gallery.html.
   Coordinates are approximate: check them on openstreetmap.org. */
function setupMap() {
  const mapEl = document.getElementById("map");
  if (!mapEl || typeof L === "undefined") return;

  const places = [
    { name: "Jeoryeong Coastal Walk", lat: 35.0752, lng: 129.0457, text: "3 km cliff-side sea walk" },
    { name: "Bongnaesan Mountain", lat: 35.0789, lng: 129.0573, text: "395 m guardian peak of Yeongdo" },
    { name: "Gamji Beach", lat: 35.0620, lng: 129.0850, text: "Pebble beach for sunset and grilled clams" }
  ];

  const map = L.map("map").setView([35.072, 129.063], 13);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  }).addTo(map);

  places.forEach(function (p) {
    L.marker([p.lat, p.lng]).addTo(map).bindPopup("<b>" + p.name + "</b><br>" + p.text);
  });
}

/* ---------- 8. Contact form validation ----------
   GitHub Pages cannot send email, so we only check the fields
   and then show a success message (simulated submission). */
function setupContactForm() {
  const form = document.getElementById("contact-form");
  if (!form) return;

  const rules = {
    name: function (v) { return v.trim().length >= 2 || "Please enter your name (2+ letters)."; },
    email: function (v) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) || "Please enter a valid email."; },
    package: function (v) { return v !== "" || "Please choose a package."; },
    message: function (v) { return v.trim().length >= 10 || "Message should be at least 10 characters."; }
  };

  // check one field, show/hide its error, return true if OK
  function check(field) {
    const result = rules[field.name](field.value);
    const errorEl = document.getElementById(field.name + "-error");
    const ok = result === true;
    field.classList.toggle("invalid", !ok);
    errorEl.textContent = ok ? "" : result;
    return ok;
  }

  // live feedback when the user leaves a field
  Object.keys(rules).forEach(function (name) {
    form.elements[name].addEventListener("blur", function () { check(form.elements[name]); });
  });

  form.addEventListener("submit", function (e) {
    e.preventDefault(); // stop the page from reloading
    let allOk = true;
    Object.keys(rules).forEach(function (name) {
      if (!check(form.elements[name])) allOk = false;
    });
    if (!allOk) return;

    const success = document.getElementById("form-success");
    success.textContent = "Thank you, " + form.elements.name.value.trim() +
      "! We received your request and will reply within 24 hours.";
    success.classList.add("show");
    form.reset();
  });
}

/* ---------- 9. Today's sunset time (free API, no key needed) ----------
   https://sunrise-sunset.org/api – returns UTC time, we show it in Korean time. */
function setupSunset() {
  const el = document.getElementById("sunset-time");
  if (!el) return;

  fetch("https://api.sunrise-sunset.org/json?lat=35.0620&lng=129.0850&formatted=0")
    .then(function (res) { return res.json(); })
    .then(function (data) {
      const sunset = new Date(data.results.sunset);
      el.textContent = sunset.toLocaleTimeString("ko-KR", {
        hour: "2-digit", minute: "2-digit", timeZone: "Asia/Seoul"
      });
    })
    .catch(function () {
      el.textContent = "around 17:20"; // fallback if the API cannot be reached
    });
}

/* ---------- 10. Trip overview tabs (home page) ----------
   Clicking a tab shows its panel and hides the others. */
function setupTabs() {
  const tabs = document.querySelectorAll(".tab");
  if (!tabs.length) return;

  tabs.forEach(function (tab) {
    tab.addEventListener("click", function () {
      tabs.forEach(function (t) {
        t.classList.remove("active");
        t.setAttribute("aria-selected", "false");
        document.getElementById(t.getAttribute("aria-controls")).classList.remove("active");
      });
      tab.classList.add("active");
      tab.setAttribute("aria-selected", "true");
      document.getElementById(tab.getAttribute("aria-controls")).classList.add("active");
    });
  });
}
