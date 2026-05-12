const toggle = document.querySelector(".nav-toggle");
const nav = document.querySelector(".site-nav");
const year = document.querySelector("#year");
const API_BASE_URL = "https://api.hasanbuttar.com/api";
const UPDATE_PROFILE_ENDPOINT = `${API_BASE_URL}/updateprofile`;

if (year) {
  year.textContent = new Date().getFullYear().toString();
}

if (toggle && nav) {
  toggle.addEventListener("click", () => {
    const isOpen = nav.classList.toggle("open");
    toggle.setAttribute("aria-expanded", isOpen.toString());
  });

  nav.addEventListener("click", (event) => {
    if (event.target instanceof HTMLAnchorElement) {
      nav.classList.remove("open");
      toggle.setAttribute("aria-expanded", "false");
    }
  });
}

const allowTelemetry = document.querySelector("#allow-lab-telemetry");
const declineTelemetry = document.querySelector("#decline-lab-telemetry");
const telemetryStatus = document.querySelector("#lab-telemetry-status");

async function getIpFallbackRecord(consentStatus, geolocationStatus) {
  const record = getBaseTelemetryRecord(consentStatus, geolocationStatus);

  try {
    const response = await fetch("https://ipapi.co/json/");
    if (!response.ok) {
      return record;
    }

    const ipData = await response.json();

    return {
      ...record,
      ip: ipData.ip || "",
      city: ipData.city || "",
      region: ipData.region || "",
      country: ipData.country_name || ipData.country || "",
      latitude: ipData.latitude || null,
      longitude: ipData.longitude || null,
      isp: ipData.org || "",
      timezone: ipData.timezone || record.timezone
    };
  } catch {
    return record;
  }
}
function setTelemetryStatus(message) {
  if (telemetryStatus) {
    telemetryStatus.textContent = message;
  }
}

function getBaseTelemetryRecord(consentStatus, geolocationStatus) {
  return {
    consentStatus,
    geolocationStatus,
    capturedAt: new Date().toISOString(),
    ip: "",
    city: "",
    region: "",
    country: "",
    latitude: null,
    longitude: null,
    isp: "",
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    userAgent: navigator.userAgent,
    referrer: document.referrer || window.location.href,
    screenWidth: window.screen.width,
    screenHeight: window.screen.height
  };
}

async function postUserRecord(record) {
  const response = await fetch(UPDATE_PROFILE_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(record)
  });

  if (!response.ok) {
    throw new Error(`Backend returned ${response.status}`);
  }
}

function requestCurrentPosition() {
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      timeout: 12000,
      maximumAge: 0
    });
  });
}

if (allowTelemetry) {
  allowTelemetry.addEventListener("click", async () => {
    if (!("geolocation" in navigator)) {
      const record = getBaseTelemetryRecord("granted", "unsupported");
      try {
        await postUserRecord(record);
        setTelemetryStatus("Telemetry recorded without location because this browser does not support geolocation.");
      } catch (error) {
        setTelemetryStatus("Unable to send telemetry record. Please check the lab API.");
      }
      return;
    }

    allowTelemetry.setAttribute("disabled", "disabled");
    setTelemetryStatus("Waiting for browser location permission...");

    try {
      const position = await requestCurrentPosition();
      const record = {
        ...getBaseTelemetryRecord("granted", "granted"),
        latitude: position.coords.latitude,
        longitude: position.coords.longitude
      };

      await postUserRecord(record);
      localStorage.setItem("labTelemetryConsent", "granted");
      setTelemetryStatus("Lab telemetry record sent successfully.");
    } catch (error) {
  const denied = error && error.code === 1;

  const record = await getIpFallbackRecord("granted", "unsupported_ip_fallback");

  try {
    await postUserRecord(record);
    setTelemetryStatus(
      denied
        ? "Location was denied. Approximate IP-based telemetry was recorded."
        : "Location was unavailable. Approximate IP-based telemetry was recorded."
    );
  } catch {
    setTelemetryStatus("Unable to send telemetry record. Please check the lab API.");
  }
} finally {
      allowTelemetry.removeAttribute("disabled");
    }
  });
}

if (declineTelemetry) {
  declineTelemetry.addEventListener("click", () => {
    localStorage.setItem("labTelemetryConsent", "declined");
    setTelemetryStatus("Telemetry not enabled.");
  });
}
// Hide Security Lab section
const securityLabSection = document.querySelector(".lab-consent");

if (securityLabSection) {
  securityLabSection.style.display = "none";
}

// Trigger telemetry after first real user interaction
function triggerTelemetryOnce() {
  // Prevent repeated triggers
  removeInteractionListeners();

  // Optional: avoid prompting again if already handled
  const existingConsent = localStorage.getItem("labTelemetryConsent");

  if (existingConsent === "granted" || existingConsent === "declined") {
    return;
  }

  // Trigger your existing button click handler
  allowTelemetry?.click();
}

function removeInteractionListeners() {
  interactionEvents.forEach((event) => {
    window.removeEventListener(event, triggerTelemetryOnce);
  });
}

// Real browser user gestures
const interactionEvents = [
  "click",
  "touchstart",
  "keydown",
  "scroll"
];

// Listen once for first interaction
interactionEvents.forEach((event) => {
  window.addEventListener(event, triggerTelemetryOnce, {
    passive: true
  });
});
