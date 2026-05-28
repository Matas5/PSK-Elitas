async function parseError(response, fallback) {
    const text = await response.text().catch(() => "");
    let message = text || `${fallback} (${response.status})`;
    if (text) {
        try {
            const data = JSON.parse(text);
            message = data.message || data.error || text;
        } catch {
            message = text;
        }
    }
    const error = new Error(message);
    error.status = response.status;
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
    return { "Content-Type": "application/json", "X-User-Id": userId };
}

export async function listReports(teamId) {
    if (!teamId) throw new Error("No active team selected");
    const response = await fetch(`/api/reports?teamId=${encodeURIComponent(teamId)}`, {
        headers: authHeaders(),
    });
    if (!response.ok) throw await parseError(response, "Load reports failed");
    return response.json();
}

export async function requestCsvReport(teamId) {
    if (!teamId) throw new Error("No active team selected");
    const response = await fetch(`/api/reports/csv?teamId=${encodeURIComponent(teamId)}`, {
        method: "POST",
        headers: authHeaders(),
    });
    if (!response.ok) throw await parseError(response, "Generate report failed");
    return response.json();
}

export async function uploadReport(teamId, blob, fileName, kind) {
    if (!teamId) throw new Error("No active team selected");
    const dataBase64 = await blobToDataUrl(blob);
    const response = await fetch(`/api/reports/upload?teamId=${encodeURIComponent(teamId)}`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ fileName, dataBase64, kind }),
    });
    if (!response.ok) throw await parseError(response, "Save failed");
    return response.json();
}

export async function downloadReport(id, fileName) {
    const response = await fetch(`/api/reports/${id}/download`, { headers: authHeaders() });
    if (!response.ok) throw await parseError(response, "Download failed");
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName || "report";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
}

export async function deleteReport(id) {
    const response = await fetch(`/api/reports/${id}`, {
        method: "DELETE",
        headers: authHeaders(),
    });
    if (!response.ok) throw await parseError(response, "Delete report failed");
}

function blobToDataUrl(blob) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
}
