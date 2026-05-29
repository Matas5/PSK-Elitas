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
