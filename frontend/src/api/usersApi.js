function authHeaders() {
    const raw = localStorage.getItem("auth_user");
    if (!raw) throw new Error("User not logged in");
    const userId = JSON.parse(raw)?.userId;
    if (!userId) throw new Error("Missing userId in auth_user");
    return { "Content-Type": "application/json", "X-User-Id": userId };
}

// register the signed-in user's display name/email so team member lists show a name, not a raw id
export async function registerProfile({ displayName, email }) {
    const response = await fetch("/api/users/me", {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ displayName: displayName || "", email: email || "" }),
    });
    if (!response.ok) throw new Error("Failed to register profile");
}
