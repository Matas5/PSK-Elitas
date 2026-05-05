export async function getHealthStatus() {
    const response = await fetch("/api/health");

    if (!response.ok) {
        throw new Error("Backend health check failed");
    }

    return response.text();
}