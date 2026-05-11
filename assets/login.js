const API_BASE_URL = "https://api.hasanbuttar.com/api";
const LOGIN_ENDPOINT = `${API_BASE_URL}/login`;
const form = document.querySelector("#login-form");
const statusText = document.querySelector("#login-status");

function setStatus(message) {
  if (statusText) {
    statusText.textContent = message;
  }
}

if (sessionStorage.getItem("labDashboardToken")) {
  window.location.href = "dashboard.html";
}

if (form) {
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    setStatus("Signing in...");

    const formData = new FormData(form);
    const username = String(formData.get("username") || "");
    const password = String(formData.get("password") || "");

    try {
      const response = await fetch(LOGIN_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ username, password })
      });

      const data = await response.json();
      if (!response.ok || data.status !== "success" || !data.token) {
        throw new Error(data.message || "Invalid credentials");
      }

      sessionStorage.setItem("labDashboardToken", data.token);
      window.location.href = "dashboard.html";
    } catch (error) {
      setStatus("Login failed. Check credentials and API availability.");
    }
  });
}
