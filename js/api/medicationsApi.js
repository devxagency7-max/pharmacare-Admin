// Medications API — backend uses /admin/medicines (not /admin/drugs)
const MEDS_ENDPOINTS = {
    LIST:           '/admin/medicines',
    CREATE:         '/admin/medicines',
    UPDATE:         (id)             => `/admin/medicines/${id}`,
    DELETE:         (id)             => `/admin/medicines/${id}`,
    TOGGLE:         (id)             => `/admin/medicines/${id}/toggle`,
    IMPORT:         '/admin/medicines/import',
    SYNONYMS:       (id)             => `/admin/medicines/${id}/synonyms`,
    ADD_SYNONYM:    (id)             => `/admin/medicines/${id}/synonyms`,
    DELETE_SYNONYM: (drugId, synId)  => `/admin/medicines/${drugId}/synonyms/${synId}`
};

async function fetchDrugs(page = 1, pageSize = 20, search = '') {
    let url = `${MEDS_ENDPOINTS.LIST}?page=${page}&pageSize=${pageSize}`;
    if (search) url += `&search=${encodeURIComponent(search)}`;
    return apiClient.get(url);
}

async function createDrug(payload) {
    if (payload instanceof FormData) {
        return apiClient.request(MEDS_ENDPOINTS.CREATE, { method: 'POST', body: payload });
    }
    return apiClient.post(MEDS_ENDPOINTS.CREATE, payload);
}

async function updateDrug(id, payload) {
    if (payload instanceof FormData) {
        return apiClient.request(MEDS_ENDPOINTS.UPDATE(id), { method: 'PUT', body: payload });
    }
    return apiClient.put(MEDS_ENDPOINTS.UPDATE(id), payload);
}

async function deleteDrug(id) {
    return apiClient.delete(MEDS_ENDPOINTS.DELETE(id));
}

async function toggleDrug(id) {
    return apiClient.patch(MEDS_ENDPOINTS.TOGGLE(id), {});
}

async function importDrugs(file) {
    const formData = new FormData();
    formData.append('file', file);

    const token = await apiClient.getAuthToken();
    const res = await fetch(`${apiClient.baseUrl}${MEDS_ENDPOINTS.IMPORT}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
    });

    if (!res.ok) throw new Error('Import failed');
    return res.json();
}

async function fetchDrugSynonyms(id) {
    return apiClient.get(MEDS_ENDPOINTS.SYNONYMS(id));
}

async function addDrugSynonym(id, name) {
    return apiClient.post(MEDS_ENDPOINTS.ADD_SYNONYM(id), { name });
}

async function deleteDrugSynonym(drugId, synId) {
    return apiClient.delete(MEDS_ENDPOINTS.DELETE_SYNONYM(drugId, synId));
}
