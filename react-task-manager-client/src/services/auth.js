// Decode a base64url JWT payload safely
function decodeJwtPayload(token) {
    try {
        const base64 = token.split('.')[1]?.replace(/-/g, '+').replace(/_/g, '/');
        return JSON.parse(atob(base64));
    } catch {
        return null;
    }
}

export function getToken() {
    return localStorage.getItem('jwt');
}

export function isAuthenticated() {
    const t = getToken();
    if (!t) return false;
    const payload = decodeJwtPayload(t);
    if (!payload?.exp) return false;
    const now = Math.floor(Date.now() / 1000);
    return payload.exp > now; // valid & not expired
}
