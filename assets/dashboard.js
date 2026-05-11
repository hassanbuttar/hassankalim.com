const GET_USER_RECORDS_ENDPOINT = "https://api.hasanbuttar.com/getuserrecords";

const loadButton = document.querySelector("#load-records");
const tokenInput = document.querySelector("#dashboard-token");
const tableBody = document.querySelector("#records-body");
const recordCount = document.querySelector("#record-count");
const locatedCount = document.querySelector("#located-count");
const latestRecord = document.querySelector("#latest-record");

function readPath(record, path, fallback = "") {
  return path.split(".").reduce((value, key) => {
    if (value && Object.prototype.hasOwnProperty.call(value, key)) {
      return value[key];
    }
    return undefined;
  }, record) ?? fallback;
}

function normalizeRecords(payload) {
  if (Array.isArray(payload)) {
    return payload;
  }
  if (Array.isArray(payload.records)) {
    return payload.records;
  }
  if (Array.isArray(payload.data)) {
    return payload.data;
  }
  return [];
}

function formatDate(value) {
  if (!value) {
    return "-";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return String(value);
  }
  return date.toLocaleString();
}

function setCell(row, value) {
  const cell = document.createElement("td");
  cell.textContent = value || "-";
  row.appendChild(cell);
  return cell;
}

function renderLocation(row, record) {
  const cell = document.createElement("td");
  const latitude = readPath(record, "location.latitude", record.latitude);
  const longitude = readPath(record, "location.longitude", record.longitude);

  if (latitude === "" || longitude === "" || latitude === undefined || longitude === undefined) {
    cell.textContent = "-";
  } else {
    const link = document.createElement("a");
    link.href = `https://www.google.com/maps?q=${encodeURIComponent(latitude)},${encodeURIComponent(longitude)}`;
    link.target = "_blank";
    link.rel = "noopener";
    link.textContent = `${latitude}, ${longitude}`;
    cell.appendChild(link);
  }

  row.appendChild(cell);
}

function renderRecords(records) {
  tableBody.textContent = "";

  if (!records.length) {
    const row = document.createElement("tr");
    const cell = document.createElement("td");
    cell.className = "dashboard-empty";
    cell.colSpan = 9;
    cell.textContent = "No records returned by the backend.";
    row.appendChild(cell);
    tableBody.appendChild(row);
  }

  const located = records.filter((record) => {
    const latitude = readPath(record, "location.latitude", record.latitude);
    const longitude = readPath(record, "location.longitude", record.longitude);
    return latitude !== "" && longitude !== "" && latitude !== undefined && longitude !== undefined;
  });

  recordCount.textContent = records.length.toString();
  locatedCount.textContent = located.length.toString();
  latestRecord.textContent = formatDate(readPath(records[0] || {}, "capturedAt", readPath(records[0] || {}, "createdAt", "")));

  records.forEach((record) => {
    const row = document.createElement("tr");
    setCell(row, formatDate(readPath(record, "capturedAt", readPath(record, "createdAt", ""))));
    setCell(row, `${readPath(record, "consentStatus", "-")} / ${readPath(record, "geolocationStatus", "-")}`);
    renderLocation(row, record);
    setCell(row, readPath(record, "location.accuracy", readPath(record, "accuracy", "")));
    setCell(row, readPath(record, "timezone", ""));
    setCell(row, readPath(record, "language", ""));
    setCell(row, readPath(record, "pageUrl", readPath(record, "pagePath", "")));
    setCell(row, readPath(record, "referrer", ""));
    setCell(row, readPath(record, "userAgent", ""));
    tableBody.appendChild(row);
  });
}

async function loadRecords() {
  loadButton.setAttribute("disabled", "disabled");
  loadButton.textContent = "Loading...";

  try {
    const headers = {};
    const token = tokenInput.value.trim();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
      sessionStorage.setItem("dashboardBearerToken", token);
    }

    const response = await fetch(GET_USER_RECORDS_ENDPOINT, { headers });
    if (!response.ok) {
      throw new Error(`Backend returned ${response.status}`);
    }

    const payload = await response.json();
    renderRecords(normalizeRecords(payload));
  } catch (error) {
    tableBody.textContent = "";
    const row = document.createElement("tr");
    const cell = document.createElement("td");
    cell.className = "dashboard-empty";
    cell.colSpan = 9;
    cell.textContent = "Unable to load records. Check API availability, CORS, and authentication.";
    row.appendChild(cell);
    tableBody.appendChild(row);
  } finally {
    loadButton.removeAttribute("disabled");
    loadButton.textContent = "Load Records";
  }
}

if (tokenInput) {
  tokenInput.value = sessionStorage.getItem("dashboardBearerToken") || "";
}

if (loadButton) {
  loadButton.addEventListener("click", loadRecords);
}
