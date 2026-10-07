(function () {
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var $ = function (sel, root) { return [].slice.call((root || document).querySelectorAll(sel)); };

  var yearEl = document.getElementById("year");
  if (yearEl) {
    yearEl.textContent = String(new Date().getFullYear());
  }

  /* Entrance reveals. The hidden state is added here, never in the CSS,
     so without JS or with reduced motion everything is simply visible.
     Browsers without scroll-driven animations get the gallery fade too. */
  if (!window.CSS || !CSS.supports("animation-timeline", "view()")) {
    $(".gal").forEach(function (el) { el.setAttribute("data-anim", "up"); });
  }

  if (!reduce && "IntersectionObserver" in window) {
    var items = $("[data-anim]");
    items.forEach(function (el) { el.classList.add("anim-pending"); });

    var reveal = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        /* above the viewport counts too, so anchor jumps never leave holes */
        if (e.isIntersecting || e.boundingClientRect.top < 0) {
          e.target.classList.remove("anim-pending");
          e.target.classList.add("anim-in");
          reveal.unobserve(e.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -6% 0px" });

    items.forEach(function (el) { reveal.observe(el); });
  }

  /* Service strips. Pointer devices: hover opens a strip, leaving the list
     closes it. Touch: the strip crossing the middle of the screen opens
     (observer on the fixed-height heads, so it cannot feed back on itself),
     and a tap toggles. */
  var list = document.getElementById("svc-list");
  if (list) {
    var strips = $(".svc", list);
    var lockedUntil = 0;

    var open = function (target) {
      strips.forEach(function (s) {
        var on = s === target;
        s.classList.toggle("is-open", on);
        s.querySelector(".svc-head").setAttribute("aria-expanded", on ? "true" : "false");
      });
      list.classList.toggle("has-open", !!target);
    };

    var hover = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

    strips.forEach(function (s) {
      var head = s.querySelector(".svc-head");
      head.addEventListener("click", function () {
        lockedUntil = Date.now() + 2500;
        open(hover || !s.classList.contains("is-open") ? s : null);
      });
      if (hover) {
        s.addEventListener("mouseenter", function () { open(s); });
        head.addEventListener("focus", function () { open(s); });
      }
    });

    if (hover) {
      list.addEventListener("mouseleave", function () { open(null); });
    } else if (!reduce && "IntersectionObserver" in window) {
      var middle = new IntersectionObserver(function (entries) {
        if (Date.now() < lockedUntil) { return; }
        entries.forEach(function (e) {
          if (e.isIntersecting) { open(e.target.parentNode); }
        });
      }, { rootMargin: "-44% 0px -44% 0px" });
      $(".svc-head", list).forEach(function (h) { middle.observe(h); });
    }
  }

  /* The call and book bar stays out of the way: hidden while the hero's own
     button is on screen, and never on top of the booking widget. */
  var dock = document.querySelector(".dock");
  if (dock && "IntersectionObserver" in window) {
    var covered = {};
    var watch = function (el, key) {
      if (!el) { return; }
      new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          covered[key] = e.isIntersecting;
          dock.classList.toggle("is-hidden", !!(covered.hero || covered.book));
        });
      }, { threshold: 0.05 }).observe(el);
    };
    watch(document.querySelector(".hero-content .btn"), "hero");
    watch(document.getElementById("book"), "book");
  }
})();

(function () {
  var wizard = document.getElementById("booking-wizard");
  if (!wizard) {
    return;
  }

  var state = { service: "", price: "", time: "", name: "", phone: "" };
  var currentStep = 1;
  var totalSteps = 4;

  var panels = wizard.querySelectorAll(".booking-panel");
  var dots = wizard.querySelectorAll(".booking-step-dot");
  var nextBtn = document.getElementById("booking-next");
  var backBtn = document.getElementById("booking-back");
  var summaryEl = document.getElementById("booking-summary");
  var sendBtn = document.getElementById("booking-send");
  var errorEl = document.getElementById("booking-error");
  var dateInput = document.getElementById("booking-date");
  var nameInput = document.getElementById("booking-name");
  var phoneInput = document.getElementById("booking-phone");

  function setError(msg) {
    errorEl.textContent = msg || "";
  }

  function showStep(step) {
    panels.forEach(function (panel) {
      panel.hidden = Number(panel.dataset.step) !== step;
    });
    dots.forEach(function (dot) {
      dot.classList.toggle("is-active", Number(dot.dataset.stepDot) <= step);
    });
    backBtn.hidden = step === 1;
    nextBtn.hidden = step === totalSteps;
    setError("");
    if (step === totalSteps) {
      renderSummary();
    }
  }

  wizard.querySelectorAll("[data-service]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      wizard.querySelectorAll("[data-service]").forEach(function (b) {
        b.classList.remove("is-selected");
      });
      btn.classList.add("is-selected");
      state.service = btn.dataset.service;
      state.price = btn.dataset.price;
      setError("");
    });
  });

  wizard.querySelectorAll("[data-time]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      wizard.querySelectorAll("[data-time]").forEach(function (b) {
        b.classList.remove("is-selected");
      });
      btn.classList.add("is-selected");
      state.time = btn.dataset.time;
    });
  });

  function renderSummary() {
    var dateVal = dateInput.value;
    var lines = [
      "Service: " + (state.service || "not selected") + (state.price ? " (" + state.price + ")" : ""),
      "Preferred date: " + (dateVal || "no preference"),
      "Time of day: " + (state.time || "no preference"),
      "Name: " + state.name,
      "Phone: " + state.phone
    ];

    summaryEl.innerHTML = "";
    lines.forEach(function (line) {
      var p = document.createElement("p");
      p.textContent = line;
      summaryEl.appendChild(p);
    });

    var message =
      "Hi JW Valets, I would like to request a booking. Service: " +
      (state.service || "not selected") +
      ". Preferred date: " +
      (dateVal || "no preference") +
      ". Time of day: " +
      (state.time || "no preference") +
      ". Name: " +
      state.name +
      ". Phone: " +
      state.phone;

    sendBtn.href = "sms:+447391518673?body=" + encodeURIComponent(message);
  }

  nextBtn.addEventListener("click", function () {
    if (currentStep === 1 && !state.service) {
      setError("Pick a service to continue.");
      return;
    }
    if (currentStep === 3) {
      state.name = nameInput.value.trim();
      state.phone = phoneInput.value.trim();
      if (!state.name || !state.phone) {
        setError("Add your name and phone number to continue.");
        return;
      }
    }
    if (currentStep < totalSteps) {
      currentStep += 1;
      showStep(currentStep);
    }
  });

  backBtn.addEventListener("click", function () {
    if (currentStep > 1) {
      currentStep -= 1;
      showStep(currentStep);
    }
  });

  showStep(currentStep);
})();
