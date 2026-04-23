const apiClient = {
    baseUrl: 'http://localhost:3000/api/v1', // Using local proxy

    async getAuthToken() {
        return localStorage.getItem('idToken');
    },

    setToken(token) {
        localStorage.setItem('idToken', token);
    },

    logout() {
        localStorage.removeItem('idToken');
        window.location.href = '/login.html';
    },

    // Build paginated URL: /endpoint?page=1&pageSize=20
    paginate(endpoint, page = 1, pageSize = 20) {
        const sep = endpoint.includes('?') ? '&' : '?';
        return `${endpoint}${sep}page=${page}&pageSize=${pageSize}`;
    },

    async request(endpoint, options = {}) {
        const token = await this.getAuthToken();
        const url = endpoint.startsWith('http') ? endpoint : `${this.baseUrl}${endpoint}`;
        
        const headers = {
            'Content-Type': 'application/json',
            ...options.headers
        };

        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const response = await fetch(url, { ...options, headers });
        
        if (response.status === 401) {
            window.location.href = '/login.html';
            throw new Error('Unauthorized');
        }

        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            throw new Error(error.message || `API Error: ${response.status}`);
        }

        return response.json();
    },

    get(endpoint, options = {}) {
        return this.request(endpoint, { ...options, method: 'GET' });
    },

    post(endpoint, body, options = {}) {
        return this.request(endpoint, { ...options, method: 'POST', body: JSON.stringify(body) });
    },

    put(endpoint, body, options = {}) {
        return this.request(endpoint, { ...options, method: 'PUT', body: JSON.stringify(body) });
    },

    delete(endpoint, options = {}) {
        return this.request(endpoint, { ...options, method: 'DELETE' });
    }
};
