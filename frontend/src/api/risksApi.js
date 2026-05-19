async function parseError(response, fallback) {
    const text = await response.text().catch(() => "");
    return new Error(text || `${fallback} (${response.status})`);
}

export async function listRisks() {
    const response = await fetch("/api/risks");

    if (!response.ok) {
        throw await parseError(response, "Load risks failed");
    }

    return response.json();
}

export async function createRisk(body) {
    const response = await fetch("/api/risks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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
        headers: { "Content-Type": "application/json" },
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
    });

    if (!response.ok) {
        throw await parseError(response, "Delete risk failed");
    }
}
