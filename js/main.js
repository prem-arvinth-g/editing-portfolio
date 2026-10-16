/* Prem Arvinth G | creative portfolio
   Plain JS, no build step. Content comes from js/data.js. */
(function () {
  "use strict";

  const S = window.SITE;
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const html = document.documentElement;
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const FPS = 25; // PAL, the Indian broadcast standard
  const ytThumb = (id, size = "hqdefault") => `https://i.ytimg.com/vi/${id}/${size}.jpg`;
  const ytEmbed = (id) => `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0&modestbranding=1`;
  const igLink = (type, id) => `https://www.instagram.com/${type}/${id}/`;
  const igEmbed = (type, id) => `https://www.instagram.com/${type}/${id}/embed/`;
  const pad = (n) => String(n).padStart(2, "0");

  function timecode(frames) {
    frames = Math.max(0, Math.floor(frames));
    const f = frames % FPS;
    const s = Math.floor(frames / FPS);
    return `${pad(Math.floor(s / 3600))}:${pad(Math.floor(s / 60) % 60)}:${pad(s % 60)}:${pad(f)}`;
  }

  function el(tag, attrs = {}, children = []) {
    const n = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) {
      if (k === "class") n.className = v;
      else if (k === "text") n.textContent = v;
      else if (k === "html") n.innerHTML = v;
      else n.setAttribute(k, v);
    }
    for (const c of [].concat(children)) if (c) n.append(c);
    return n;
  }

  const ICON_PLAY = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 4v16l13-8z"/></svg>';

  /* ---------------- links and static text ---------------- */

  function fillLinks() {
    $("#ytChannel").href = S.youtube.channelUrl;
    $("#blenderHandle").href = S.blender.url;
    const mail = $("#mailLink");
    mail.href = `mailto:${S.email}?subject=${encodeURIComponent("Video editing project")}`;
    mail.textContent = S.email;
    $("#waLink").href = `https://wa.me/${S.whatsapp}`;
    $("#telLink").href = `tel:${S.phone.replace(/\s/g, "")}`;
    $("#telLink").textContent = `Call ${S.phone}`;
    $("#igLink").href = S.links.instagram;
    $("#liLink").href = S.links.linkedin;
    $("#ghLink").href = S.links.github;
    $("#devLink").href = S.links.devPortfolio;
    $("#year").textContent = new Date().getFullYear();
  }

  /* ---------------- lightbox ---------------- */

  const lb = {
    dlg: $("#lightbox"),
    frame: $("#lbFrame"),
    caption: $("#lbCaption"),
    list: [],
    index: 0,
    returnFocus: null,

    open(list, index) {
      this.list = list;
      this.index = index;
      this.returnFocus = document.activeElement;
      this.render();
      if (!this.dlg.open) {
        this.dlg.showModal();
        this.dlg.focus(); // focus the dialog itself, not the first button or the player
      }
    },
    render() {
      const item = this.list[this.index];
      this.frame.replaceChildren();
      if (item.kind === "yt") {
        this.frame.append(el("iframe", {
          class: "lb-16x9", src: ytEmbed(item.id), title: item.title,
          allow: "autoplay; encrypted-media; picture-in-picture; fullscreen", allowfullscreen: "",
        }));
      } else if (item.kind === "ig") {
        this.frame.append(el("iframe", {
          class: "lb-9x16", src: igEmbed(item.type, item.id), title: item.title,
          allow: "autoplay; encrypted-media; picture-in-picture; fullscreen",
        }));
      } else {
        this.frame.append(el("img", { src: item.src, alt: item.alt }));
      }
      this.caption.textContent = item.caption || "";
      const many = this.list.length > 1;
      $("#lbPrev").hidden = !many;
      $("#lbNext").hidden = !many;
    },
    step(d) {
      if (this.list.length < 2) return;
      this.index = (this.index + d + this.list.length) % this.list.length;
      this.render();
    },
    close() { this.dlg.close(); },
  };

  function initLightbox() {
    $("#lbClose").addEventListener("click", () => lb.close());
    $("#lbPrev").addEventListener("click", () => lb.step(-1));
    $("#lbNext").addEventListener("click", () => lb.step(1));
    lb.dlg.addEventListener("click", (e) => {
      if (e.target === lb.dlg || e.target === lb.frame) lb.close();
    });
    lb.dlg.addEventListener("keydown", (e) => {
      if (e.key === "ArrowLeft") lb.step(-1);
      if (e.key === "ArrowRight") lb.step(1);
    });
    lb.dlg.addEventListener("close", () => {
      lb.frame.replaceChildren(); // stops playback
      if (lb.returnFocus) lb.returnFocus.focus({ preventScroll: true });
    });
  }

  /* ---------------- film leader ---------------- */

  function runLeader(done) {
    if (!html.classList.contains("leader-on")) return done();
    const leader = $("#leader");
    const num = $(".leader-num", leader);
    let n = 3, finished = false;
    const finish = () => {
      if (finished) return;
      finished = true;
      clearInterval(timer);
      try { sessionStorage.setItem("leaderSeen", "1"); } catch (e) {}
      leader.classList.add("is-flash"); // two-frame white flash, then hard cut
      setTimeout(() => { html.classList.remove("leader-on"); done(); }, 80);
    };
    const timer = setInterval(() => {
      n -= 1;
      if (n === 0) finish();
      else num.textContent = n;
    }, 500);
    leader.addEventListener("click", finish);
    addEventListener("keydown", finish, { once: true });
  }

  /* ---------------- hero program monitor ---------------- */

  function initHero() {
    const monitor = $("#monitor");
    const stage = $("#stage");
    const tcEl = $("#heroTc");
    const clipEl = $("#heroClip");
    const toggle = $("#heroToggle");
    const photoByFile = Object.fromEntries(S.photos.map((p) => [p.file, p]));

    const shots = S.heroShots.map((s, i) => {
      // for edits, use a clean frame from inside the video rather than the titled thumbnail
      const src = s.photo ? `assets/photos/${s.photo}.jpg` : ytThumb(s.yt, `maxres${s.frame || 2}`);
      const alt = s.photo ? photoByFile[s.photo].alt : "Frame from a YouTube edit";
      const img = el("img", { alt: i === 0 ? alt : "", decoding: "async" });
      img.dataset.src = src;
      stage.append(img);
      return img;
    });
    shots[0].setAttribute("fetchpriority", "high");

    const load = (img) => new Promise((res) => {
      if (img.dataset.loaded) return res();
      img.onload = img.onerror = () => { img.dataset.loaded = "1"; res(); };
      img.src = img.dataset.src;
    });

    let i = 0, playing = !reduced, visible = true, timer = null;
    let frames = 0, last = performance.now();

    function show(n) {
      shots[i].classList.remove("is-on");
      shots[i].alt = "";
      i = n;
      // restart the push-in animation on every cut
      void shots[i].offsetWidth;
      shots[i].classList.add("is-on");
      clipEl.textContent = `A001_C${String(i + 1).padStart(3, "0")}`;
      load(shots[(i + 1) % shots.length]); // preload the next shot
    }

    function schedule() {
      clearTimeout(timer);
      if (!playing || !visible) return;
      timer = setTimeout(async () => {
        const next = (i + 1) % shots.length;
        await load(shots[next]);
        if (playing && visible) show(next);
        schedule();
      }, 1800);
    }

    function tick(now) {
      if (playing && visible) {
        frames += ((now - last) / 1000) * FPS;
        tcEl.textContent = timecode(frames);
      }
      last = now;
      requestAnimationFrame(tick);
    }

    function setPlaying(p) {
      playing = p;
      monitor.classList.toggle("is-paused", !p);
      toggle.setAttribute("aria-pressed", String(!p));
      toggle.setAttribute("aria-label", p ? "Pause the hero slideshow" : "Play the hero slideshow");
      schedule();
    }

    load(shots[0]).then(() => {
      shots[0].classList.add("is-on");
      load(shots[1]);
    });
    toggle.addEventListener("click", () => setPlaying(!playing));
    new IntersectionObserver(([e]) => { visible = e.isIntersecting; schedule(); }).observe(monitor);
    document.addEventListener("visibilitychange", () => { visible = !document.hidden; schedule(); });
    setPlaying(playing);
    requestAnimationFrame(tick);

    // showreel slot
    if (S.showreel) {
      const m = S.showreel.match(/(?:v=|youtu\.be\/|shorts\/|embed\/)([\w-]{11})/);
      if (m) {
        const btn = $("#showreelBtn");
        btn.hidden = false;
        btn.addEventListener("click", () => lb.open([{ kind: "yt", id: m[1], title: "Showreel", caption: "Showreel" }], 0));
      }
    }

    return { toggle: () => setPlaying(!playing) };
  }

  /* ---------------- YouTube edits with hover skimming ---------------- */

  function initYouTube() {
    const grid = $("#ytGrid");
    const vids = S.youtube.videos;
    const items = vids.map((v) => ({ kind: "yt", id: v.id, title: v.title, caption: `${v.title}, edited for ${S.youtube.channel}` }));

    vids.forEach((v, n) => {
      const feature = n === 0;
      const cover = ytThumb(v.id, feature ? "maxresdefault" : "hqdefault");
      // YouTube publishes three auto-captured frames from inside every video
      const size = feature ? "maxres" : "hq";
      const frames = [cover, ytThumb(v.id, `${size}1`), ytThumb(v.id, `${size}2`), ytThumb(v.id, `${size}3`)];
      const img = el("img", { src: cover, alt: "", loading: "lazy", decoding: "async" });
      const head = el("span", { class: "skim-head" });
      const bar = el("span", { class: "skim-bar", html: "<i></i><i></i><i></i><i></i>" });
      const thumb = el("span", { class: "thumb" }, [
        img, head, bar,
        el("span", { class: "thumb-play", html: `${ICON_PLAY}Play` }),
      ]);
      const card = el("button", { class: `yt${feature ? " yt-feature" : ""}`, type: "button", "aria-label": `Play ${v.title}` }, [
        thumb,
        el("span", { class: "yt-meta" }, [
          el("span", { class: "yt-title", text: v.title }),
          el("span", { class: "yt-by", text: S.youtube.channel }),
        ]),
      ]);
      $(".yt-meta", card).style.display = "grid";

      let primed = false, shown = 0;
      thumb.addEventListener("pointerenter", (e) => {
        if (e.pointerType !== "mouse" || primed) return;
        primed = true;
        frames.slice(1).forEach((src) => { const p = new Image(); p.src = src; });
      });
      thumb.addEventListener("pointermove", (e) => {
        if (e.pointerType !== "mouse") return;
        const r = thumb.getBoundingClientRect();
        const x = Math.min(Math.max(e.clientX - r.left, 0), r.width);
        const idx = Math.min(3, Math.floor((x / r.width) * 4));
        thumb.classList.add("is-skimming");
        head.style.transform = `translateX(${x}px)`;
        if (idx !== shown) {
          shown = idx;
          img.src = frames[idx];
          $$("i", bar).forEach((b, k) => b.classList.toggle("on", k === idx));
        }
      });
      thumb.addEventListener("pointerleave", () => {
        thumb.classList.remove("is-skimming");
        if (shown !== 0) { shown = 0; img.src = cover; }
      });
      card.addEventListener("click", () => lb.open(items, n));
      grid.append(card);
    });
  }

  /* ---------------- Instagram rails ---------------- */

  // Covers live in assets/reels/<id>.jpg. The Instagram player only loads in the lightbox.
  function buildRail(rail, group, label) {
    const items = group.ids.map((id, n) => {
      const title = `${label} ${pad(n + 1)} by ${group.handle}`;
      return { kind: "ig", type: group.type, id, title, caption: title };
    });
    group.ids.forEach((id, n) => {
      const num = pad(n + 1);
      const { title } = items[n];
      const screen = el("button", { class: "screen", type: "button", "aria-label": `Play ${title}` }, [
        el("img", { src: `assets/reels/${id}.jpg`, alt: "", loading: "lazy", decoding: "async" }),
        el("span", { class: "thumb-play", html: `${ICON_PLAY}Play` }),
      ]);
      screen.addEventListener("click", () => lb.open(items, n));
      rail.append(el("article", { class: "reel" }, [
        el("div", { class: "phone" }, [screen]),
        el("p", { class: "reel-meta" }, [
          el("span", { text: num }),
          el("a", { href: igLink(group.type, id), target: "_blank", rel: "noopener", text: "Open on Instagram" }),
        ]),
      ]));
    });
  }

  function initReels() {
    const groups = S.reels;
    const tablist = $("#reelTabs");
    const note = $("#reelNote");
    const nav = $("#reels .rail-nav");
    buildRail($("#rail-3d"), S.blender, "Blender post");

    const tabs = groups.map((g, k) => {
      const rail = el("div", { class: "rail", id: `rail-${k}`, role: "tabpanel", "aria-labelledby": `tab-${k}`, tabindex: "0" });
      buildRail(rail, g, g.itemLabel || "Reel");
      nav.before(rail);
      const tab = el("button", { role: "tab", id: `tab-${k}`, "aria-controls": `rail-${k}`, type: "button" }, [
        document.createTextNode(`${g.label} `),
        el("span", { class: "count", text: g.ids.length }),
      ]);
      tablist.append(tab);
      return tab;
    });
    let current = 0;

    function select(n, focus) {
      current = n;
      tabs.forEach((t, k) => {
        const on = k === n;
        t.setAttribute("aria-selected", String(on));
        t.tabIndex = on ? 0 : -1;
        $(`#rail-${k}`).hidden = !on;
      });
      const g = groups[n];
      note.replaceChildren(
        document.createTextNode(`${g.note} `),
        el("a", { href: g.url, target: "_blank", rel: "noopener", text: `See all on ${g.handle}` }),
      );
      if (focus) tabs[n].focus();
    }
    tabs.forEach((t, k) => {
      t.addEventListener("click", () => select(k));
      t.addEventListener("keydown", (e) => {
        if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
          e.preventDefault();
          select((current + (e.key === "ArrowRight" ? 1 : -1) + tabs.length) % tabs.length, true);
        }
      });
    });
    select(0);

    $$(".rail-btn").forEach((b) => b.addEventListener("click", () => {
      const rail = $$("#reels .rail").find((r) => !r.hidden);
      rail.scrollBy({ left: Number(b.dataset.dir) * rail.clientWidth * 0.85, behavior: reduced ? "auto" : "smooth" });
    }));
  }

  /* ---------------- photographs ---------------- */

  function initPhotos() {
    const g = $("#gallery");
    const items = S.photos.map((p, n) => ({
      kind: "img", src: `assets/photos/${p.file}.jpg`, alt: p.alt,
      caption: `${pad(n + 1)} / ${pad(S.photos.length)}  ${p.alt}`,
    }));
    S.photos.forEach((p, n) => {
      const img = el("img", {
        src: `assets/photos/thumbs/${p.file}.jpg`, alt: p.alt, width: p.w, height: p.h,
        loading: "lazy", decoding: "async", "data-loading": "",
      });
      img.addEventListener("load", () => img.removeAttribute("data-loading"), { once: true });
      if (img.complete) img.removeAttribute("data-loading");
      const b = el("button", { class: "shot", type: "button", "aria-label": `Open photo: ${p.alt}` }, [img]);
      b.style.setProperty("--tone", p.tone);
      b.addEventListener("click", () => lb.open(items, n));
      g.append(b);
    });
  }

  /* ---------------- the timeline ---------------- */

  function initTimeline(hero) {
    const sections = $$("main > section[data-clip]");
    const v1 = $("#tlV1");
    const body = $("#tlBody");
    const playhead = $("#tlPlayhead");
    const tlTime = $("#tlTime");
    const tlClip = $("#tlClip");
    const wave = $("#tlWave");
    const navLinks = $$(".toplinks a");
    const TOTAL = 3 * 60 * FPS; // the page "runs" for three minutes
    const flash = el("div", { class: "cut-flash", "aria-hidden": "true" });
    document.body.append(flash);

    const clips = sections.map((s) => {
      const a = el("a", { class: "clip", href: `#${s.id}`, draggable: "false" }, [el("span", { class: "clip-label", text: s.dataset.clip })]);
      a.style.setProperty("--clip", s.dataset.color);
      v1.append(a);
      return a;
    });

    // filmstrips inside the clips, added once the page is idle
    const strips = {
      youtube: S.youtube.videos.map((v) => ytThumb(v.id, "default")),
      photos: S.photos.slice(0, 8).map((p) => `assets/photos/thumbs/${p.file}.jpg`),
      intro: S.photos.slice(8, 14).map((p) => `assets/photos/thumbs/${p.file}.jpg`),
    };
    const idle = window.requestIdleCallback || ((fn) => setTimeout(fn, 1200));
    idle(() => sections.forEach((s, k) => {
      const list = strips[s.id];
      if (!list) return;
      clips[k].prepend(el("span", { class: "clip-strip", "aria-hidden": "true" },
        list.map((src) => el("img", { src, alt: "" }))));
    }));

    // audio track: a deterministic waveform
    const BARS = 180;
    let seed = 47;
    const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    wave.setAttribute("viewBox", `0 0 ${BARS} 20`);
    let bars = "";
    for (let k = 0; k < BARS; k++) {
      const env = 0.45 + 0.55 * Math.abs(Math.sin(k / 9)) * (0.6 + 0.4 * Math.sin(k / 31));
      const h = Math.max(1.5, env * (0.35 + rnd() * 0.65) * 18);
      bars += `<rect x="${k + 0.15}" y="${(20 - h) / 2}" width="0.7" height="${h}" rx="0.3"/>`;
    }
    wave.innerHTML =
      `<defs><clipPath id="played" clipPathUnits="userSpaceOnUse"><rect id="playedRect" x="0" y="0" width="0" height="20"/></clipPath></defs>` +
      `<g fill="rgba(63,194,178,.32)">${bars}</g><g fill="#3FC2B2" clip-path="url(#played)">${bars}</g>`;
    const playedRect = $("#playedRect", wave);

    let tops = [], docH = 1, maxScroll = 1;

    function measure() {
      docH = document.documentElement.scrollHeight;
      maxScroll = Math.max(1, docH - innerHeight);
      tops = sections.map((s) => s.getBoundingClientRect().top + scrollY);
      tops[0] = 0;
      sections.forEach((s, k) => {
        const start = tops[k] / docH;
        const end = (k + 1 < sections.length ? tops[k + 1] : docH) / docH;
        clips[k].style.left = `${start * 100}%`;
        clips[k].style.width = `calc(${(end - start) * 100}% - 1px)`;
        const tc = $(`[data-tc-for="${s.id}"]`);
        if (tc) tc.textContent = `In ${timecode(start * TOTAL)}`;
      });
      update();
    }

    // reading position runs from the top of the page to the bottom of the page
    const pointAt = (y) => y + innerHeight * (y / maxScroll);
    const scrollFor = (point) => point / (1 + innerHeight / maxScroll);

    let active = -1;
    function update() {
      const p = Math.min(1, Math.max(0, pointAt(scrollY) / docH));
      const w = body.clientWidth;
      playhead.style.transform = `translateX(${p * w}px)`;
      playedRect.setAttribute("width", String(p * BARS));
      tlTime.textContent = timecode(p * TOTAL);
      let k = 0;
      const point = pointAt(scrollY);
      for (let n = 0; n < tops.length; n++) if (point >= tops[n]) k = n;
      if (k !== active) {
        active = k;
        clips.forEach((c, n) => c.classList.toggle("is-active", n === k));
        tlClip.textContent = sections[k].dataset.clip;
        navLinks.forEach((a) => a.classList.toggle("is-active", a.getAttribute("href") === `#${sections[k].id}`));
      }
    }

    let ticking = false;
    addEventListener("scroll", () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => { ticking = false; update(); });
    }, { passive: true });
    addEventListener("resize", measure);
    new ResizeObserver(() => measure()).observe(document.body);
    addEventListener("load", measure);
    document.fonts && document.fonts.ready.then(measure);
    measure();

    // jumping between sections is a hard cut, not a smooth scroll
    function cutTo(k) {
      const s = sections[k];
      if (!s) return;
      if (!reduced) {
        flash.classList.remove("is-on");
        void flash.offsetWidth;
        flash.classList.add("is-on");
      }
      const y = k === 0 ? 0 : tops[k] - (parseFloat(getComputedStyle(html).scrollPaddingTop) || 0);
      window.scrollTo({ top: y, behavior: "instant" });
      history.replaceState(null, "", `#${s.id}`);
    }

    // drag on the timeline to scrub; a plain click on a clip cuts to that section
    let dragging = false, startX = 0, moved = false;
    const scrubTo = (clientX) => {
      const r = body.getBoundingClientRect();
      const ratio = Math.min(1, Math.max(0, (clientX - r.left) / r.width));
      window.scrollTo({ top: scrollFor(ratio * docH), behavior: "instant" });
    };
    body.addEventListener("pointerdown", (e) => {
      if (e.button !== 0) return;
      dragging = true;
      moved = false;
      startX = e.clientX;
      body.setPointerCapture(e.pointerId);
    });
    body.addEventListener("pointermove", (e) => {
      if (!dragging) return;
      if (!moved && Math.abs(e.clientX - startX) < 4) return;
      moved = true;
      scrubTo(e.clientX);
    });
    const endDrag = () => { dragging = false; };
    body.addEventListener("dragstart", (e) => e.preventDefault());
    body.addEventListener("pointerup", endDrag);
    body.addEventListener("pointercancel", endDrag);
    body.addEventListener("click", (e) => {
      const clip = e.target.closest(".clip");
      e.preventDefault();
      if (e.detail === 0) moved = false; // keyboard activation
      if (moved) return;
      if (clip) cutTo(clips.indexOf(clip));
      else scrubTo(e.clientX);
    });

    // in-page links also cut
    $$('a[href^="#"]').forEach((a) => {
      if (a.closest(".timeline")) return;
      a.addEventListener("click", (e) => {
        const k = sections.findIndex((s) => `#${s.id}` === a.getAttribute("href"));
        if (k < 0) return;
        e.preventDefault();
        cutTo(k);
        sections[k].querySelector("h2, h1")?.setAttribute("tabindex", "-1");
        sections[k].querySelector("h2, h1")?.focus({ preventScroll: true });
      });
    });

    // J / K / L, the editor's transport keys
    addEventListener("keydown", (e) => {
      if (e.metaKey || e.ctrlKey || e.altKey || lb.dlg.open) return;
      if (/^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName) || e.target.isContentEditable) return;
      const key = e.key.toLowerCase();
      if (key === "j") cutTo(Math.max(0, active - 1));
      else if (key === "l") cutTo(Math.min(sections.length - 1, active + 1));
      else if (key === "k") hero.toggle();
    });
  }

  /* ---------------- boot ---------------- */

  fillLinks();
  initLightbox();
  const hero = initHero();
  initYouTube();
  initReels();
  initPhotos();
  initTimeline(hero);
  // a timer rather than rAF, so a page opened in a background tab never stays closed
  runLeader(() => setTimeout(() => html.classList.add("ready"), 30));
})();
