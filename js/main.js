const DATA = "./data";

const state = {
  profil: null,
  skill: [],
  pendidikan: [],
  pengalaman: [],
};

async function loadJSON(file) {
  const res = await fetch(`${DATA}/${file}`, { cache: "no-cache" });
  if (!res.ok) throw new Error(`Gagal memuat ${file}: ${res.status}`);
  return res.json();
}

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text != null) node.textContent = text;
  return node;
}

function renderProfil(p) {
  state.profil = p;
  document.querySelectorAll('[data-bind="profil.nama"]').forEach((n) => (n.textContent = p.nama));
  document.title = `${p.nama} — ${p.peran}`;

  const set = (selector, value) => {
    const node = document.querySelector(selector);
    if (node) node.textContent = value;
  };
  set('[data-bind="profil.lokasi"]', p.lokasi);
  set('[data-bind="profil.peran"]', p.peran);
  set('[data-bind="profil.tagline"]', p.tagline);

  const foto = document.getElementById("foto");
  if (foto && p.foto) {
    foto.src = p.foto;
    foto.alt = `Foto ${p.nama}`;
  }

  const list = document.getElementById("social-list");
  list.replaceChildren(
    ...p.sosial.map((s) => {
      const li = el("li");
      const a = el("a", null, s.label);
      a.href = s.url;
      a.rel = "noopener noreferrer";
      if (!s.url.startsWith("mailto:")) a.target = "_blank";
      li.append(a);
      return li;
    })
  );
}

function renderSkill(items) {
  state.skill = items;
  const list = document.getElementById("skill-list");
  list.replaceChildren(
    ...items.map((s) => {
      const li = el("li", "skill-card");
      const top = el("div", "skill-top");
      top.append(el("span", "skill-name", s.nama), el("span", "skill-value", `${s.level}%`));

      const bar = el("div", "bar");
      bar.setAttribute("role", "progressbar");
      bar.setAttribute("aria-valuenow", String(s.level));
      bar.setAttribute("aria-valuemin", "0");
      bar.setAttribute("aria-valuemax", "100");
      bar.setAttribute("aria-label", s.nama);
      const fill = el("div", "bar-fill");
      fill.style.width = "0";
      bar.append(fill);

      li.append(top, bar);
      return li;
    })
  );

  requestAnimationFrame(() => {
    list.querySelectorAll(".bar-fill").forEach((fill, i) => {
      fill.style.width = `${items[i].level}%`;
    });
  });
}

function renderTimeline(targetId, items, mapFn) {
  const list = document.getElementById(targetId);
  list.replaceChildren(
    ...items.map((item) => {
      const li = el("li", "timeline-item");
      const { period, title, sub, note } = mapFn(item);
      li.append(
        el("p", "timeline-period", period),
        el("h3", "timeline-title", title),
        el("p", "timeline-sub", sub),
        el("p", null, note)
      );
      return li;
    })
  );
}

function renderPendidikan(items) {
  state.pendidikan = items;
  renderTimeline("pendidikan-list", items, (i) => ({
    period: i.periode,
    title: i.institusi,
    sub: i.jurusan,
    note: i.keterangan,
  }));
}

function renderPengalaman(items) {
  state.pengalaman = items;
  renderTimeline("pengalaman-list", items, (i) => ({
    period: i.periode,
    title: i.posisi,
    sub: i.perusahaan,
    note: i.keterangan,
  }));
}

/* Nav toggle */
function initNav() {
  const toggle = document.querySelector(".nav-toggle");
  const nav = document.getElementById("menu");
  toggle.addEventListener("click", () => {
    const open = nav.classList.toggle("open");
    toggle.setAttribute("aria-expanded", String(open));
  });
  nav.addEventListener("click", (e) => {
    if (e.target.tagName === "A") {
      nav.classList.remove("open");
      toggle.setAttribute("aria-expanded", "false");
    }
  });
}

/* Contact form */
const RULES = {
  nama: (v) => (v.trim().length >= 2 ? "" : "Nama minimal 2 karakter."),
  email: (v) => (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()) ? "" : "Format email tidak valid."),
  pesan: (v) => (v.trim().length >= 10 ? "" : "Pesan minimal 10 karakter."),
};

function showError(name, message) {
  const field = document.querySelector(`[name="${name}"]`)?.closest(".field");
  const slot = document.querySelector(`[data-error-for="${name}"]`);
  if (!field || !slot) return;
  field.classList.toggle("has-error", Boolean(message));
  slot.textContent = message;
}

function validateField(name, value) {
  const message = RULES[name] ? RULES[name](value) : "";
  showError(name, message);
  return !message;
}

function initForm() {
  const form = document.getElementById("contact-form");
  const status = document.getElementById("form-status");
  const fields = ["nama", "email", "pesan"];

  fields.forEach((name) => {
    const input = form.elements[name];
    input.addEventListener("blur", () => validateField(name, input.value));
    input.addEventListener("input", () => {
      if (input.closest(".field").classList.contains("has-error")) {
        validateField(name, input.value);
      }
    });
  });

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const results = fields.map((name) => validateField(name, form.elements[name].value));
    if (results.includes(false)) {
      status.textContent = "Periksa kembali kolom yang ditandai.";
      status.classList.remove("ok");
      form.querySelector(".has-error input, .has-error textarea")?.focus();
      return;
    }

    const payload = {
      nama: form.elements.nama.value.trim(),
      email: form.elements.email.value.trim(),
      pesan: form.elements.pesan.value.trim(),
    };

    console.log("Pesan dikirim:", payload);
    status.textContent = `Terima kasih, ${payload.nama}. Pesanmu sudah tersimpan (backend belum tersambung).`;
    status.classList.add("ok");
    form.reset();
    fields.forEach((name) => showError(name, ""));
  });
}

function initYear() {
  const node = document.getElementById("year");
  if (node) node.textContent = String(new Date().getFullYear());
}

async function init() {
  initNav();
  initForm();
  initYear();

  try {
    const [profil, skill, pendidikan, pengalaman] = await Promise.all([
      loadJSON("profil.json"),
      loadJSON("skill.json"),
      loadJSON("pendidikan.json"),
      loadJSON("pengalaman.json"),
    ]);
    renderProfil(profil);
    renderSkill(skill);
    renderPendidikan(pendidikan);
    renderPengalaman(pengalaman);
  } catch (err) {
    console.error(err);
    const status = document.getElementById("form-status");
    if (status) {
      status.textContent = "Gagal memuat data. Jalankan lewat server lokal (bukan file://).";
      status.classList.add("has-error");
    }
  }
}

init();
