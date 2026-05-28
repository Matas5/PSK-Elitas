async function parseError(response, fallback) {
    const text = await response.text().catch(() => "");

    let data = null;
    let message = text || `${fallback} (${response.status})`;

    if (text) {
        try {
            data = JSON.parse(text);
            message = data.message || data.error || text;
        } catch {
            message = text;
        }
    }

    const error = new Error(message);
    error.status = response.status;
    if (data) error.data = data;
    return error;
}

function authHeaders() {
    const raw = localStorage.getItem("auth_user");

    if (!raw) {
        throw new Error("User not logged in");
    }

    const authUser = JSON.parse(raw);
    const headers = { "Content-Type": "application/json" };

    const userId = authUser?.userId;
    if (!userId) {
        throw new Error("Missing userId in auth_user");
    }
    headers["X-User-Id"] = userId;

    return headers;
}

export async function listRisks(teamId) {
    if (!teamId) {
        throw new Error("No active team selected");
    }

    const response = await fetch(`/api/risks?teamId=${encodeURIComponent(teamId)}`, {
        headers: authHeaders()
    });

    if (!response.ok) {
        throw await parseError(response, "Load risks failed");
    }

    return response.json();
}

export async function getRisk(id) {
    const response = await fetch(`/api/risks/${id}`, {
        headers: authHeaders()
    });

    if (!response.ok) {
        throw await parseError(response, "Load risk failed");
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
