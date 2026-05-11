const API_BASE_URL = "https://api.hasanbuttar.com/api";
const GET_USER_RECORDS_ENDPOINT = `${API_BASE_URL}/getprofiles`;
const LOGIN_PAGE = "login.html";

const loadButton = document.querySelector("#load-records");
const logoutButton = document.querySelector("#logout");
const tableBody = document.querySelector("#records-body");
const recordCount = document.querySelector("#record-count");
const locatedCount = document.querySelector("#located-count");
const latestRecord = document.querySelector("#latest-record");
const dashboardUser = document.querySelector("#dashboard-user");

const token = sessionStorage.getItem("labDashboardToken");

if (!token) {
  window.location.href = LOGIN_PAGE;
}

if (dashboardUser) {
  dashboardUser.textContent = "Signed in";
}

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
  const latitude = record.latitude;
  const longitude = record.longitude;

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
    const latitude = record.latitude;
    const longitude = record.longitude;
    return latitude !== "" && longitude !== "" && latitude !== undefined && longitude !== undefined;
  });

  recordCount.textContent = records.length.toString();
  locatedCount.textContent = located.length.toString();
  latestRecord.textContent = formatDate(readPath(records[0] || {}, "visit_time", ""));

  records.forEach((record) => {
    const row = document.createElement("tr");
    setCell(row, formatDate(record.visit_time));
    setCell(row, record.country ? `${record.city || "-"}, ${record.country}` : "-");
    renderLocation(row, record);
    setCell(row, record.ip);
    setCell(row, record.isp);
    setCell(row, record.timezone);
    setCell(row, `${record.screen_width || "-"} x ${record.screen_height || "-"}`);
    setCell(row, record.referrer);
    setCell(row, record.user_agent);
    tableBody.appendChild(row);
  });
}

async function loadRecords() {
  loadButton.setAttribute("disabled", "disabled");
  loadButton.textContent = "Loading...";

  try {
    const response = await fetch(GET_USER_RECORDS_ENDPOINT, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    if (response.status === 401 || response.status === 403) {
      sessionStorage.removeItem("labDashboardToken");
      window.location.href = LOGIN_PAGE;
      return;
    }

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

if (loadButton) {
  loadButton.addEventListener("click", loadRecords);
  loadRecords();
}

if (logoutButton) {
  logoutButton.addEventListener("click", () => {
    sessionStorage.removeItem("labDashboardToken");
    window.location.href = LOGIN_PAGE;
  });
}
