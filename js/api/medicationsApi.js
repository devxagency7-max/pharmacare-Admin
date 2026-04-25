// Medications API Logic
const MEDS_ENDPOINTS = {
    LIST: '/admin/drugs',
    CREATE: '/admin/drugs',
    UPDATE: (id) => `/admin/drugs/${id}`,
    DELETE: (id) => `/admin/drugs/${id}`,
    TOGGLE: (id) => `/admin/drugs/${id}/toggle`,
    IMPORT: '/admin/drugs/import',
    SYNONYMS: (id) => `/admin/drugs/${id}/synonyms`,
    ADD_SYNONYM: (id) => `/admin/drugs/${id}/synonyms`,
    DELETE_SYNONYM: (drugId, synId) => `/admin/drugs/${drugId}/synonyms/${synId}`
};

/**
 * Fetch drugs with pagination and search
 */
async function fetchDrugs(page = 1, pageSize = 20, search = '') {
    let url = `${MEDS_ENDPOINTS.LIST}?page=${page}&pageSize=${pageSize}`;
    if (search) url += `&search=${encodeURIComponent(search)}`;
    return apiClient.get(url);
}

/**
 * Create a new medication
 */
async function createDrug(payload) {
    if (payload instanceof FormData) {
        return apiClient.request(MEDS_ENDPOINTS.CREATE, { method: 'POST', body: payload });
    }
    return apiClient.post(MEDS_ENDPOINTS.CREATE, payload);
}

/**
 * Update an existing medication
 */
async function updateDrug(id, payload) {
    if (payload instanceof FormData) {
        return apiClient.request(MEDS_ENDPOINTS.UPDATE(id), { method: 'PUT', body: payload });
    }
    return apiClient.put(MEDS_ENDPOINTS.UPDATE(id), payload);
}

/**
 * Toggle drug active status
 */
async function toggleDrug(id) {
    return apiClient.patch(MEDS_ENDPOINTS.TOGGLE(id), {});
}

/**
 * Import drugs via Excel
 */
async function importDrugs(file) {
    const formData = new FormData();
    formData.append('file', file);
    
    // Using native fetch for multipart
    const token = await apiClient.getAuthToken();
    const res = await fetch(`${apiClient.baseUrl}${MEDS_ENDPOINTS.IMPORT}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
    });
    
    if (!res.ok) throw new Error('Import failed');
    return res.json();
}
