const API_URL = "/api";

export async function signup(email, password, userData = {}) {
    const res = await fetch(`${API_URL}/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, userData })
    });

    const data = await res.json();
    if (!res.ok) {
        throw new Error(data.message || "Signup failed");
    }
    return data;
}

export async function login(email, password) {
    const res = await fetch(`${API_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
    });

    const data = await res.json();
    if (!res.ok) {
        throw new Error(data.message || "Login failed");
    }

    localStorage.setItem("token", data.token);
    localStorage.setItem("userId", data.userId);
    window.location.href = "index.html";
}

export async function fetchMyAppointments() {
    const token = localStorage.getItem("token");
    if (!token) return [];

    const res = await fetch("/api/appointments", {
        headers: { Authorization: `Bearer ${token}` }
    });

    if (!res.ok) return [];
    return await res.json();
}

// Helper to include token in any authenticated request
export function getAuthHeaders() {
    const token = localStorage.getItem("token");
    return token ? { Authorization: `Bearer ${token}` } : {};
}