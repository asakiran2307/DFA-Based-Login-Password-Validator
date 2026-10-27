(() => {
  "use strict";

  const MIN_LENGTH = 8;
  const REQUIRED_MASK = 0b1111;
  const bits = Object.freeze({ lower: 0b0001, upper: 0b0010, digit: 0b0100, special: 0b1000 });
  const elements = {
    input: document.getElementById("passwordInput"),
    toggle: document.getElementById("toggleVisibility"),
    reset: document.getElementById("resetButton"),
    resultBox: document.getElementById("resultBox"),
    resultIcon: document.getElementById("resultIcon"),
    resultTitle: document.getElementById("resultTitle"),
    resultMessage: document.getElementById("resultMessage"),
    resultState: document.getElementById("resultState"),
    requirementsCount: document.getElementById("requirementsCount"),
    stateCode: document.getElementById("stateCode"),
    stateStatus: document.getElementById("stateStatus"),
    inputLength: document.getElementById("inputLength"),
    classMask: document.getElementById("classMask"),
    transitionCount: document.getElementById("transitionCount"),
    traceCount: document.getElementById("traceCount"),
    traceBody: document.getElementById("traceBody")
  };

  function classify(character) {
    let mask = 0;
    if (/[a-z]/.test(character)) mask |= bits.lower;
    if (/[A-Z]/.test(character)) mask |= bits.upper;
    if (/[0-9]/.test(character)) mask |= bits.digit;
    if (!/[a-zA-Z0-9]/.test(character)) mask |= bits.special;
    return mask;
  }

  function stateName(length, mask) {
    return `q(${length},${mask.toString(2).padStart(4, "0")})`;
  }

  function classNames(mask) {
    const names = [];
    if (mask & bits.lower) names.push("lowercase");
    if (mask & bits.upper) names.push("uppercase");
    if (mask & bits.digit) names.push("digit");
    if (mask & bits.special) names.push("special");
    return names.length ? names.join(" + ") : "other";
  }

  function buildTrace(password) {
    let length = 0;
    let mask = 0;
    const trace = [];
    for (const character of password) {
      const before = stateName(length, mask);
      length = Math.min(MIN_LENGTH, length + 1);
      mask |= classify(character);
      trace.push({
        step: trace.length + 1,
        character,
        classes: classNames(classify(character)),
        before,
        after: stateName(length, mask)
      });
    }
    return { length, mask, trace, accepted: length >= MIN_LENGTH && mask === REQUIRED_MASK };
  }

  function setRequirement(rule, passed) {
    const row = document.querySelector(`.requirement[data-rule="${rule}"]`);
    if (!row) return;
    row.classList.toggle("passed", passed);
    const icon = row.querySelector(".check-icon");
    if (icon) icon.textContent = passed ? "✓" : "○";
  }

  function updateBits(mask) {
    document.querySelectorAll(".state-bits [data-bit]").forEach((item) => {
      const bit = bits[item.dataset.bit];
      const active = Boolean(mask & bit);
      item.classList.toggle("active", active);
      const value = item.querySelector("b");
      if (value) value.textContent = active ? "1" : "0";
    });
  }

  function renderTrace(trace) {
    elements.traceCount.textContent = `${trace.length} transition${trace.length === 1 ? "" : "s"}`;
    if (trace.length === 0) {
      elements.traceBody.innerHTML = '<tr class="empty-row"><td colspan="5">Your transition log will appear here when you type.</td></tr>';
      return;
    }
    const fragment = document.createDocumentFragment();
    trace.forEach((entry) => {
      const row = document.createElement("tr");
      [String(entry.step), printable(entry.character), entry.classes, entry.before, entry.after].forEach((value) => {
        const cell = document.createElement("td");
        cell.textContent = value;
        row.appendChild(cell);
      });
      fragment.appendChild(row);
    });
    elements.traceBody.replaceChildren(fragment);
  }

  function printable(character) {
    if (character === " ") return "␠ (space)";
    if (character === "\t") return "\\t";
    if (character === "\n") return "\\n";
    return character;
  }

  function update() {
    const password = elements.input.value;
    const result = buildTrace(password);
    const checks = {
      length: password.length >= MIN_LENGTH,
      lower: Boolean(result.mask & bits.lower),
      upper: Boolean(result.mask & bits.upper),
      digit: Boolean(result.mask & bits.digit),
      special: Boolean(result.mask & bits.special)
    };
    Object.entries(checks).forEach(([key, passed]) => setRequirement(key, passed));
    const passedCount = Object.values(checks).filter(Boolean).length;
    elements.requirementsCount.textContent = `${passedCount} / 5`;
    elements.stateCode.textContent = stateName(result.length, result.mask);
    elements.resultState.textContent = stateName(result.length, result.mask);
    elements.inputLength.innerHTML = `${result.length} <small>/ 8+${password.length > MIN_LENGTH ? "" : ""}</small>`;
    elements.classMask.textContent = result.mask.toString(2).padStart(4, "0");
    elements.transitionCount.textContent = String(result.trace.length);
    updateBits(result.mask);
    renderTrace(result.trace);

    elements.resultBox.classList.toggle("accepted", password.length > 0 && result.accepted);
    elements.resultBox.classList.toggle("rejected", password.length > 0 && !result.accepted);
    elements.stateStatus.classList.toggle("accepted", password.length > 0 && result.accepted);
    elements.stateStatus.classList.toggle("rejected", password.length > 0 && !result.accepted);

    if (!password.length) {
      elements.resultIcon.textContent = "δ";
      elements.resultTitle.textContent = "Waiting for input";
      elements.resultMessage.textContent = "Type a password to start the state machine.";
      elements.stateStatus.textContent = "INITIAL";
    } else if (result.accepted) {
      elements.resultIcon.textContent = "✓";
      elements.resultTitle.textContent = "String accepted";
      elements.resultMessage.textContent = "The final state satisfies every acceptance condition.";
      elements.stateStatus.textContent = "ACCEPTING";
    } else {
      elements.resultIcon.textContent = "×";
      elements.resultTitle.textContent = "String rejected";
      const missing = Object.entries(checks).filter(([, passed]) => !passed).map(([key]) => ({
        length: "8+ characters", lower: "a lowercase letter", upper: "an uppercase letter",
        digit: "a number", special: "a special character"
      })[key]);
      elements.resultMessage.textContent = `Missing: ${missing.join(", ")}.`;
      elements.stateStatus.textContent = "NON-ACCEPTING";
    }
  }

  elements.input.addEventListener("input", update);
  elements.toggle.addEventListener("click", () => {
    const showing = elements.input.type === "text";
    elements.input.type = showing ? "password" : "text";
    elements.toggle.textContent = showing ? "SHOW" : "HIDE";
    elements.toggle.setAttribute("aria-label", showing ? "Show password" : "Hide password");
    elements.toggle.setAttribute("aria-pressed", String(!showing));
    elements.input.focus();
  });
  elements.reset.addEventListener("click", () => {
    elements.input.value = "";
    elements.input.type = "password";
    elements.toggle.textContent = "SHOW";
    elements.toggle.setAttribute("aria-label", "Show password");
    elements.toggle.setAttribute("aria-pressed", "false");
    update();
    elements.input.focus();
  });

  // Lightweight invariant checks catch accidental changes to the DFA rules.
  function runSelfChecks() {
    const cases = [
      ["", false],
      ["abcdefgh", false],
      ["Abcdefg1", false],
      ["Abcdef1!", true],
      ["A1!bcdefg", true],
      ["Ab1!xyz", false]
    ];
    for (const [value, expected] of cases) {
      if (buildTrace(value).accepted !== expected) {
        console.error("DFA self-check failed for sample:", value);
      }
    }
  }

  runSelfChecks();
  update();
})();