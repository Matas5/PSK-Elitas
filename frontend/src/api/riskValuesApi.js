async function parseError(response, fallback) {
    const text = await response.text().catch(() => "");
    return new Error(text || `${fallback} (${response.status})`);
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
