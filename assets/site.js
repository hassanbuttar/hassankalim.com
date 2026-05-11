const toggle = document.querySelector(".nav-toggle");
const nav = document.querySelector(".site-nav");
const year = document.querySelector("#year");
const API_BASE_URL = "https://api.hasanbuttar.com/api";
const USER_RECORD_ENDPOINT = `${API_BASE_URL}/updateprofile`;

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
  const response = await fetch(USER_RECORD_ENDPOINT, {
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
      const record = getBaseTelemetryRecord("granted", denied ? "denied" : "unavailable");
      try {
        await postUserRecord(record);
        setTelemetryStatus(denied ? "Location was denied. A consent record was sent without coordinates." : "Location was unavailable. A telemetry record was sent without coordinates.");
      } catch (postError) {
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
