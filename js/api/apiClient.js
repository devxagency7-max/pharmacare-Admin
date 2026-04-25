const apiClient = {
    baseUrl: (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
             ? 'http://localhost:3000/api/v1' 
             : 'http://148.230.114.124:8080/api/v1',

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
        
        const isFormData = options.body instanceof FormData;
        const headers = { ...options.headers };
        if (!isFormData) {
            headers['Content-Type'] = 'application/json';
        }

        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const response = await fetch(url, { ...options, headers });
        
        if (response.status === 401) {
            window.location.href = '/login.html';
            throw new Error('Unauthorized');
        }

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            const msg = errorData.message || errorData.error || `API Error: ${response.status}`;
            console.error('[API Client Error]', errorData);
            const error = new Error(msg);
            error.status = response.status;
            error.data = errorData;
            throw error;
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
    },

    patch(endpoint, body = {}, options = {}) {
        return this.request(endpoint, { ...options, method: 'PATCH', body: JSON.stringify(body) });
    },

    banUser(id) {
        return this.put(`/admin/users/${id}/ban`, {});
    },

    suspendUser(id) {
        return this.put(`/admin/users/${id}/suspend`, {});
    },

    activateUser(id) {
        return this.put(`/admin/users/${id}/activate`, {});
    }
};
