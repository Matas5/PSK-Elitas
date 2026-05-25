async function parseError(response, fallback) {
    const text = await response.text().catch(() => "");
    return new Error(text || `${fallback} (${response.status})`);
}

export async function localRegister({ username, password }) {
    const response = await fetch("/api/auth/local/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
    });

    if (!response.ok) {
        throw await parseError(response, "Register failed");
    }

    return response.json();
}

export async function localLogin({ username, password }) {
    const response = await fetch("/api/auth/local/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
    });

    if (!response.ok) {
        throw await parseError(response, "Login failed");
    }

    return response.json();
}
