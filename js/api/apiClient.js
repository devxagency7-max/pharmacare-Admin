const apiClient = {
    baseUrl: '/api/v1',

    async getAuthToken() {
        return localStorage.getItem('idToken');
    },

    setToken(token) {
        localStorage.setItem('idToken', token);
    },

    logout() {
        localStorage.removeItem('idToken');
        const isSubDir = window.location.pathname.toLowerCase().includes('/pages/');
        window.location.href = isSubDir ? '../login.html' : 'login.html';
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

        if (response.status === 401 || response.status === 403) {
            const is403 = response.status === 403;
            console.error(is403 ? '[Auth] 403 Forbidden on:' : '[Auth] 401 Unauthorized on:', url);
            
            // If user just logged in, don't redirect immediately to allow parallel requests to complete
            const justLoggedIn = sessionStorage.getItem('justLoggedIn');
            if (justLoggedIn) {
                setTimeout(() => {
                    sessionStorage.removeItem('justLoggedIn');
                }, 2000);
                throw new Error(is403 ? 'Forbidden: Access Denied' : 'Unauthorized');
            }
            
            localStorage.removeItem('idToken');
            
            const errorMsg = is403 
                ? 'Access Denied: Your account does not have Admin privileges.' 
                : 'Session expired or unauthorized. Please log in with an Admin account.';
            sessionStorage.setItem('authError', errorMsg);
            
            const isSubDir = window.location.pathname.toLowerCase().includes('/pages/');
            window.location.href = isSubDir ? '../login.html' : 'login.html';
            throw new Error(is403 ? 'Forbidden' : 'Unauthorized');
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
