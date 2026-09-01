(function () {
  var yearEl = document.getElementById("year");
  if (yearEl) {
    yearEl.textContent = String(new Date().getFullYear());
  }

  var prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  if (prefersReducedMotion || !("IntersectionObserver" in window)) {
    return;
  }

  var revealEls = document.querySelectorAll(".reveal-init");

  revealEls.forEach(function (el) {
    el.classList.add("js-hidden");
  });

  var observer = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.remove("js-hidden");
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15, rootMargin: "0px 0px -60px 0px" }
  );

  revealEls.forEach(function (el) {
    observer.observe(el);
  });
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
