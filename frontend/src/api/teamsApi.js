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
    const userId = authUser?.userId;
    if (!userId) {
        throw new Error("Missing userId in auth_user");
    }

    return {
        "Content-Type": "application/json",
        "X-User-Id": userId,
    };
}

export async function listTeams() {
    const response = await fetch("/api/teams", {
        headers: authHeaders(),
    });

    if (!response.ok) {
        throw await parseError(response, "Load teams failed");
    }

    return response.json();
}

export async function createTeam(body) {
    const response = await fetch("/api/teams", {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify(body),
    });

    if (!response.ok) {
        throw await parseError(response, "Create team failed");
    }

    return response.json();
}

export async function joinTeam(body) {
    const response = await fetch("/api/teams/join", {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify(body),
    });

    if (!response.ok) {
        throw await parseError(response, "Join team failed");
    }

    return response.json();
}

export async function listTeamMembers(teamId) {
    const response = await fetch(`/api/teams/${teamId}/members`, {
        headers: authHeaders(),
    });

    if (!response.ok) {
        throw await parseError(response, "Load team members failed");
    }

    return response.json();
}
