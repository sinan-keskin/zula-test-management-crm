// Proxy URL - Render'da aldığınız adresi buraya yapıştırın
const PROXY_BASE_URL = 'https://zula-proxy.onrender.com'; 

export const proxyApi = {
    async signIn(email, password) {
        const res = await fetch(`${PROXY_BASE_URL}/auth/signin`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        return await res.json();
    },

    async signOut() {
        await fetch(`${PROXY_BASE_URL}/auth/signout`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        });
    },

    async getData(table, params = {}) {
        const query = new URLSearchParams(params).toString();
        const res = await fetch(`${PROXY_BASE_URL}/api/${table}?${query}`);
        return await res.json();
    },

    async postData(table, payload) {
        const res = await fetch(`${PROXY_BASE_URL}/api/${table}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        return await res.json();
    },

    async patchData(table, payload) {
        const res = await fetch(`${PROXY_BASE_URL}/api/${table}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        return await res.json();
    }
};
