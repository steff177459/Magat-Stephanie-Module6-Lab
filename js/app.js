"use strict";

/* ---------- Pure validation functions (no DOM access) ---------- */

function isValidStudentNumber(value) {
  if (typeof value !== "string") return false;
  return /^\d{2}-\d{4}-\d{3}$/.test(value.trim());
}

function isValidPassword(value) {
  if (typeof value !== "string") return false;
  return (
    value.length >= 8 &&
    /[A-Z]/.test(value) &&
    /\d/.test(value) &&
    /[@$!]/.test(value) &&
    !/\s/.test(value)
  );
}

function isValidFullName(value) {
  return typeof value === "string" && value.trim().length >= 2;
}

function isValidEmail(value) {
  return typeof value === "string" && /^[^\s@]+@[^\s@.]+\.[^\s@]+$/.test(value.trim());
}

function isValidMobileNumber(value) {
  return typeof value === "string" && /^(09\d{9}|\+639\d{9})$/.test(value.trim());
}

/* Export for the autograder when CommonJS is available */
if (typeof module !== "undefined" && module.exports) {
  module.exports = { isValidStudentNumber, isValidPassword };
}

/* ---------- Browser-only code ---------- */

if (typeof document !== "undefined") {
  const $ = (id) => document.getElementById(id);

  const form = $("registrationForm");
  const successMessage = $("successMessage");
  const summary = $("registrationSummary");
  const passwordFeedback = $("passwordFeedback");

  /* Each rule returns an error message, or "" when the value is fine. */
  const rules = {
    fullName: () => {
      const v = $("fullName").value.trim();
      if (v === "") return "Enter your full name.";
      if (v.length < 2) return "Your name must have at least 2 characters.";
      return "";
    },
    studentNumber: () =>
      isValidStudentNumber($("studentNumber").value)
        ? ""
        : "Enter a student number in the format 24-1234-123.",
    email: () =>
      isValidEmail($("email").value)
        ? ""
        : "Enter an email like name@example.com, with no spaces.",
    mobileNumber: () =>
      isValidMobileNumber($("mobileNumber").value)
        ? ""
        : "Enter 09 followed by 9 digits, or +639 followed by 9 digits, with no spaces or hyphens.",
    password: () =>
      isValidPassword($("password").value)
        ? ""
        : "Use at least 8 characters with an uppercase letter, a digit, and one of @, $ or !, and no spaces.",
    confirmPassword: () => {
      const confirm = $("confirmPassword").value;
      if (confirm === "") return "Confirm your password.";
      return confirm === $("password").value ? "" : "Passwords do not match.";
    },
    course: () => {
      const v = $("course").value;
      return v === "BSIT" || v === "BSCS" ? "" : "Select BSIT or BSCS.";
    },
    terms: () => ($("terms").checked ? "" : "You must agree to the terms to register."),
  };

  function showError(field, message) {
    const input = $(field);
    $(field + "Error").textContent = message;
    input.setAttribute("aria-invalid", message ? "true" : "false");
  }

  function checkField(field) {
    const message = rules[field]();
    showError(field, message);
    return message === "";
  }

  /* ---------- Live password feedback ---------- */
  function updatePasswordFeedback() {
    const v = $("password").value;
    if (v === "") {
      passwordFeedback.textContent = "";
      return;
    }
    const missing = [];
    if (v.length < 8) missing.push("at least 8 characters");
    if (!/[A-Z]/.test(v)) missing.push("an uppercase letter");
    if (!/\d/.test(v)) missing.push("a digit");
    if (!/[@$!]/.test(v)) missing.push("one of @, $ or !");
    if (/\s/.test(v)) missing.push("no spaces");

    passwordFeedback.textContent = missing.length
      ? "Password still needs: " + missing.join(", ") + "."
      : "Password meets all requirements.";
  }

  /* ---------- Clear everything back to the initial state ---------- */
  function clearMessages() {
    Object.keys(rules).forEach((field) => showError(field, ""));
    passwordFeedback.textContent = "";
    successMessage.textContent = "";
    successMessage.hidden = true;
    ["summaryName", "summaryStudentNumber", "summaryEmail", "summaryMobileNumber", "summaryCourse"]
      .forEach((id) => { $(id).textContent = ""; });
    summary.hidden = true;
  }

  /* ---------- Events ---------- */

  // 1. Submit
  form.addEventListener("submit", (event) => {
    event.preventDefault();

    // Run every check (no short-circuit) so all errors show at once
    const results = Object.keys(rules).map(checkField);
    const allValid = results.every(Boolean);

    if (!allValid) {
      successMessage.textContent = "";
      successMessage.hidden = true;
      summary.hidden = true;
      const firstInvalid = form.querySelector('[aria-invalid="true"]');
      if (firstInvalid) firstInvalid.focus();
      return;
    }

    $("summaryName").textContent = $("fullName").value.trim();
    $("summaryStudentNumber").textContent = $("studentNumber").value.trim();
    $("summaryEmail").textContent = $("email").value.trim();
    $("summaryMobileNumber").textContent = $("mobileNumber").value.trim();
    $("summaryCourse").textContent = $("course").value;

    successMessage.textContent = "Registration details validated successfully!";
    successMessage.hidden = false;
    summary.hidden = false;
  });

  // 2. Password: input event
  $("password").addEventListener("input", () => {
    updatePasswordFeedback();
    if ($("password").getAttribute("aria-invalid") === "true") checkField("password");
    if ($("confirmPassword").value !== "") checkField("confirmPassword");
  });

  // 3. Full name: blur event
  $("fullName").addEventListener("blur", () => checkField("fullName"));

  // 4. Course and terms: change event
  $("course").addEventListener("change", () => checkField("course"));
  $("terms").addEventListener("change", () => checkField("terms"));

  // Re-check a field as the user corrects it, so its error disappears
  ["fullName", "studentNumber", "email", "mobileNumber", "confirmPassword"].forEach((field) => {
    $(field).addEventListener("input", () => {
      if ($(field).getAttribute("aria-invalid") === "true") checkField(field);
    });
  });

  // 5. Reset: the browser restores the controls; we clear the messages
  form.addEventListener("reset", clearMessages);
}