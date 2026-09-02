(function () {
  var yearEl = document.getElementById("year");
  if (yearEl) {
    yearEl.textContent = String(new Date().getFullYear());
  }

  var prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  /* Scroll entrance motion. Headings with data-anim="left" slide in from
     the left, blocks with data-anim="up" fade up, each once when they
     enter the viewport. Anything already on screen at load is shown
     straight away, so nothing above the fold waits on an async callback.
     A safety timer reveals any stragglers if the observer never fires.
     Under prefers-reduced-motion we never hide anything at all. */
  if (!prefersReducedMotion && "IntersectionObserver" in window) {
    var animEls = document.querySelectorAll("[data-anim]");

    var reveal = function (el) {
      el.classList.remove("anim-pending");
      el.classList.add("anim-in");
    };

    animEls.forEach(function (el) {
      el.classList.add("anim-pending");
    });

    var animObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            reveal(entry.target);
            animObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
    );

    animEls.forEach(function (el) {
      animObserver.observe(el);
    });

    /* Safety nets so content is never left invisible: reveal whatever is
       in view once the page has fully loaded, then force-reveal anything
       still pending shortly after. */
    var revealVisible = function () {
      var vh = window.innerHeight || document.documentElement.clientHeight;
      document.querySelectorAll("[data-anim].anim-pending").forEach(function (el) {
        if (el.getBoundingClientRect().top < vh) {
          reveal(el);
        }
      });
    };
    window.addEventListener("load", revealVisible);
    window.setTimeout(function () {
      document.querySelectorAll("[data-anim].anim-pending").forEach(reveal);
    }, 2000);
  }

  /* Keep the floating contact button clear of the booking widget on
     small screens: hide it while the booking section is on screen. */
  var fab = document.querySelector(".fab");
  var bookingSection = document.getElementById("book");
  if (fab && bookingSection && "IntersectionObserver" in window) {
    var smallScreen = window.matchMedia("(max-width: 699px)");

    var fabObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          var overlapping = entry.isIntersecting && smallScreen.matches;
          fab.classList.toggle("is-hidden", overlapping);
        });
      },
      { threshold: 0.08 }
    );

    fabObserver.observe(bookingSection);

    if (smallScreen.addEventListener) {
      smallScreen.addEventListener("change", function () {
        if (!smallScreen.matches) {
          fab.classList.remove("is-hidden");
        }
      });
    }
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
