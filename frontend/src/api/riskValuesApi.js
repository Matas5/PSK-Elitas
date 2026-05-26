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

export async function listRiskValues(riskId) {
    const response = await fetch(`/api/risks/${riskId}/values`);

    if (!response.ok) {
        throw await parseError(response, "Load risk values failed");
    }

    return response.json();
}

export async function createRiskValues(riskId, body) {
    const response = await fetch(`/api/risks/${riskId}/values`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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
        headers: { "Content-Type": "application/json" },
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
    });

    if (!response.ok) {
        throw await parseError(response, "Delete risk value failed");
    }
}
