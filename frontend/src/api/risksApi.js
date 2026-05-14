export async function createRisk(body) {
    const response = await fetch("/api/risks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
    });

    if (!response.ok) {
        const text = await response.text().catch(() => "");
        throw new Error(text || `Create risk failed (${response.status})`);
    }

    return response.json();
}
