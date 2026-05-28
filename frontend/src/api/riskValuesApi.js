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

export async function listRiskValues(
    riskId,
    { page = 0, size = 10, sortField = "recordedAt", sortDirection = "desc" } = {},
) {
    const params = new URLSearchParams({
        page: String(page),
        size: String(size),
        sort: `${sortField},${sortDirection}`,
    });
    const response = await fetch(`/api/risks/${riskId}/values?${params.toString()}`, {
        headers: authHeaders(),
    });

    if (!response.ok) {
        throw await parseError(response, "Load risk values failed");
    }

    return response.json();
}

// Pages through the values endpoint (backend caps size at 100) into a flat array.
export async function listAllRiskValues(riskId, { sortField = "recordedAt", sortDirection = "desc" } = {}) {
    const size = 100;
    const first = await listRiskValues(riskId, { page: 0, size, sortField, sortDirection });
    const all = [...first.content];

    for (let page = 1; page < first.totalPages; page += 1) {
        const next = await listRiskValues(riskId, { page, size, sortField, sortDirection });
        all.push(...next.content);
    }

    return all;
}

export async function createRiskValues(riskId, body) {
    const response = await fetch(`/api/risks/${riskId}/values`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify(body),
    });

    if (!response.ok) {
        throw await parseError(response, "Create risk values failed");
    }

    return response.json();
}

export async function updateRiskValue(riskId, valueId, body) {
    const response = await fetch(`/api/risks/${riskId}/values/${valueId}`, {
        method: "PUT",
        headers: authHeaders(),
        body: JSON.stringify(body),
    });

    if (!response.ok) {
        throw await parseError(response, "Update risk value failed");
    }

    return response.json();
}

export async function deleteRiskValue(riskId, valueId) {
    const response = await fetch(`/api/risks/${riskId}/values/${valueId}`, {
        method: "DELETE",
        headers: authHeaders(),
    });

    if (!response.ok) {
        throw await parseError(response, "Delete risk value failed");
    }
}
