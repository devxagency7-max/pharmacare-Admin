const API_BASE_URL = 'http://148.230.114.124:8080/api/v1';

/**
 * Global API Client for PharmaCare Admin Dashboard
 * Handles base URL, auth headers, and response parsing.
 */
const apiClient = {
    /**
     * Get the stored authentication token
     */
    getToken: () => localStorage.getItem('pharmacare_admin_token'),

    /**
     * Store the authentication token
     */
    setToken: (token) => localStorage.setItem('pharmacare_admin_token', token),

    /**
     * Remove the authentication token
     */
    clearToken: () => localStorage.removeItem('pharmacare_admin_token'),

    /**
     * Core fetch wrapper
     */
    async request(endpoint, options = {}) {
        // Use the local Node.js proxy to bypass CORS (since corsproxy.io blocks IP addresses)
        const PROXY_URL = 'http://localhost:3000/?url=';
        let targetUrl = `${API_BASE_URL}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;
        
        // Always route through local proxy to avoid CORS
        const url = `${PROXY_URL}${encodeURIComponent(targetUrl)}`;
        
        const headers = {
            'Content-Type': 'application/json',
            ...(options.headers || {})
        };

        const token = this.getToken();
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const config = {
            ...options,
            headers
        };

        try {
            console.log(`[API CLIENT DEBUG] Requesting: ${config.method} ${url}`);
            const response = await fetch(url, config);

            // Handle unauthorized globally
            if (response.status === 401) {
                console.warn('[API] Unauthorized (401). Redirecting to login...');
                this.clearToken();
                if (!window.location.pathname.includes('login.html')) {
                    window.location.href = (window.location.pathname.includes('pages/') ? '../' : '') + 'login.html';
                }
                throw new Error('Unauthorized');
            }

            if (!response.ok) {
                // Try to get detailed error from JSON, or fallback to plain text body
                let errorMessage = `API Error: ${response.status}`;
                try {
                    const errorText = await response.text();
                    try {
                        const errorData = JSON.parse(errorText);
                        console.error(`[API] Error JSON (${response.status}):`, errorData);
                        errorMessage = errorData.message || errorData.error || errorData.description || errorData.msg || errorMessage;
                    } catch (e) {
                        // Not JSON, use the raw text if it's not too long
                        console.error(`[API] Error Text (${response.status}):`, errorText);
                        if (errorText && errorText.length < 200) errorMessage = errorText;
                    }
                } catch (e) {
                    console.error('[API] Could not read error body');
                }
                throw new Error(errorMessage);
            }

            // Return JSON or empty object for 204
            if (response.status === 204) return {};
            const data = await response.json();
            console.log(`[API] Success: ${url}`, data);
            return data;
        } catch (error) {
            console.error(`[API] Fetch Exception for ${url}:`, error.message);
            throw error;
        }
    },

    get: (endpoint, options = {}) => apiClient.request(endpoint, { ...options, method: 'GET' }),
    post: (endpoint, body, options = {}) => apiClient.request(endpoint, { ...options, method: 'POST', body: JSON.stringify(body) }),
    put: (endpoint, body, options = {}) => apiClient.request(endpoint, { ...options, method: 'PUT', body: JSON.stringify(body) }),
    patch: (endpoint, body, options = {}) => apiClient.request(endpoint, { ...options, method: 'PATCH', body: JSON.stringify(body) }),
    delete: (endpoint, options = {}) => apiClient.request(endpoint, { ...options, method: 'DELETE' }),

    /**
     * Build a paginated endpoint URL with query params
     */
    paginate: (endpoint, page = 1, pageSize = 20, extraParams = {}) => {
        const params = new URLSearchParams({ page, pageSize, ...extraParams });
        return `${endpoint}?${params.toString()}`;
    },

    /**
     * Firebase Auth Registration (SignUp)
     * Directly calls Google Identity Toolkit API to create an account
     */
    async registerFirebaseUser(email, password) {
        const FIREBASE_SIGNUP_URL = 'https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=AIzaSyCXMY-UDoD36xHZEpBUxstflXHzkA2EAe8';
        
        try {
            console.log(`[FIREBASE] Attempting signup for: ${email}`);
            const response = await fetch(FIREBASE_SIGNUP_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email,
                    password,
                    returnSecureToken: true
                })
            });

            const data = await response.json();
            
            if (!response.ok) {
                console.error('[FIREBASE] Error:', data);
                throw new Error(data.error?.message || 'Firebase registration failed');
            }

            console.log('[FIREBASE] Success: User created with UID:', data.localId);
            return data; // Contains localId (UID)
        } catch (error) {
            console.error('[FIREBASE] Exception:', error.message);
            throw error;
        }
    }
};

