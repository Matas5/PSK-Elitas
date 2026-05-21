async function parseError(response, fallback) {
    const text = await response.text().catch(() => "");
    if (text) {
        try {
            const body = JSON.parse(text);
            return new Error(body.message || body.error || text);
        } catch {
            return new Error(text);
        }
    }

    return new Error(`${fallback} (${response.status})`);
}

function authHeaders() {
    const raw = localStorage.getItem("auth_user");

    if (!raw) {
        throw new Error("User not logged in");
    }

    const authUser = JSON.parse(raw);
    const googleUserId = authUser?.googleId;

    if (!googleUserId) {
        throw new Error("Missing googleId in auth_user");
    }

    const headers = {
        "X-Google-User-Id": googleUserId
    };

    headers["Content-Type"] = "application/json";

    return headers;
}

export async function listRisks() {
    const response = await fetch("/api/risks", {
        headers: authHeaders()
    });

    if (!response.ok) {
        throw await parseError(response, "Load risks failed");
    }

    return response.json();
}

export async function createRisk(body) {
    const response = await fetch("/api/risks", {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify(body),
    });

    if (!response.ok) {
        throw await parseError(response, "Create risk failed");
    }

    return response.json();
}

export async function updateRisk(id, body) {
    const response = await fetch(`/api/risks/${id}`, {
        method: "PUT",
        headers: authHeaders(),
        body: JSON.stringify(body),
    });

    if (!response.ok) {
        throw await parseError(response, "Update risk failed");
    }

    return response.json();
}

export async function deleteRisk(id) {
    const response = await fetch(`/api/risks/${id}`, {
        method: "DELETE",
        headers: authHeaders()
    });

    if (!response.ok) {
        throw await parseError(response, "Delete risk failed");
    }
}
