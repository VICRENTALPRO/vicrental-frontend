/**
 * VicRental Pro — API Client
 * Shared across all three portals (PM, Owner, Tenant)
 * Replace API_BASE with your Railway URL after deployment
 */

const API_BASE = 'https://vicrental-backend1-production.up.railway.app/api';
// After deployment, replace the line above with your actual URL, e.g.:
// const API_BASE = 'https://vicrental-backend-production.up.railway.app/api';

const Api = {
  // ── Token management ──────────────────────────────────────────
  getToken()        { return localStorage.getItem('vr_token'); },
  setToken(t)       { localStorage.setItem('vr_token', t); },
  clearToken()      { localStorage.removeItem('vr_token'); localStorage.removeItem('vr_user'); },
  getUser()         { try { return JSON.parse(localStorage.getItem('vr_user') || 'null'); } catch { return null; } },
  setUser(u)        { localStorage.setItem('vr_user', JSON.stringify(u)); },

  // ── Base fetch ────────────────────────────────────────────────
  async request(method, path, body = null, isFormData = false) {
    const headers = {};
    const token = this.getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;
    if (!isFormData && body) headers['Content-Type'] = 'application/json';

    const opts = { method, headers };
    if (body) opts.body = isFormData ? body : JSON.stringify(body);

    const res = await fetch(`${API_BASE}${path}`, opts);
    if (res.status === 401) { this.clearToken(); window.location.reload(); return; }
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
    return data;
  },

  get:    (path)          => Api.request('GET',    path),
  post:   (path, body)    => Api.request('POST',   path, body),
  patch:  (path, body)    => Api.request('PATCH',  path, body),
  delete: (path)          => Api.request('DELETE', path),
  upload: (path, formData) => Api.request('POST',  path, formData, true),

  // ── Auth ──────────────────────────────────────────────────────
  async loginPM(email, password) {
    const d = await this.post('/auth/pm/login', { email, password });
    this.setToken(d.token); this.setUser(d.user); return d;
  },
  async loginOwner(name, password) {
    const d = await this.post('/auth/owner/login', { name, password });
    this.setToken(d.token); this.setUser(d.user); return d;
  },
  async loginTenant(email, password) {
    const d = await this.post('/auth/tenant/login', { email, password });
    this.setToken(d.token); this.setUser(d.user); return d;
  },
  async registerTenant(data) {
    const d = await this.post('/auth/tenant/register', data);
    this.setToken(d.token); this.setUser(d.user); return d;
  },
  logout() { this.clearToken(); window.location.reload(); },

  // ── Work Orders ───────────────────────────────────────────────
  getWorkOrders:    ()        => Api.get('/workorders'),
  createWorkOrder:  (data)    => Api.post('/workorders', data),
  updateWorkOrder:  (id, data) => Api.patch(`/workorders/${id}`, data),
  deleteWorkOrder:  (id)      => Api.delete(`/workorders/${id}`),
  uploadWOPhoto:    (id, file) => {
    const fd = new FormData(); fd.append('photo', file);
    return Api.upload(`/workorders/${id}/photos`, fd);
  },

  // ── Tenant Requests ───────────────────────────────────────────
  submitTenantRequest: (formData) => Api.upload('/tenant-requests', formData),
  getMyRequests:       ()         => Api.get('/tenant-requests/mine'),
  getAllTenantRequests: ()         => Api.get('/tenant-requests/all'),
  ackTenantRequest:    (id)       => Api.patch(`/tenant-requests/${id}/status`, { status: 'inprogress' }),
  completeTenantRequest: (id)     => Api.patch(`/tenant-requests/${id}/status`, { status: 'completed' }),
  respondToTenantRequest: (id, message) => Api.post(`/tenant-requests/${id}/respond`, { message }),

  // ── Quotes ────────────────────────────────────────────────────
  getQuotes:         ()             => Api.get('/quotes'),
  getMyQuotes:       ()             => Api.get('/quotes/mine'),
  createQuote:       (formData)     => Api.upload('/quotes', formData),
  reviewQuote:       (id, type, comment) => Api.post(`/quotes/${id}/review`, { type, comment }),
  rescindQuoteReview: (id)          => Api.delete(`/quotes/${id}/review`),
  deleteQuote:       (id)           => Api.delete(`/quotes/${id}`),

  // ── Document Vault ────────────────────────────────────────────
  getVaultDocs:      ()         => Api.get('/vault'),
  getMyVaultDocs:    ()         => Api.get('/vault/mine'),
  uploadVaultDoc:    (formData) => Api.upload('/vault', formData),
  toggleDocVisibility: (id)     => Api.patch(`/vault/${id}/visibility`),
  deleteVaultDoc:    (id)       => Api.delete(`/vault/${id}`),

  // ── Owner Portal Items ────────────────────────────────────────
  getPortalItems:    ()         => Api.get('/portal'),
  getMyPortalItems:  ()         => Api.get('/portal/mine'),
  reviewPortalItem:  (id, type, comment) => Api.post(`/portal/${id}/review`, { type, comment }),

  // ── Activity Log ──────────────────────────────────────────────
  getActivity:       ()         => Api.get('/activity'),
  logActivity:       (message, color) => Api.post('/activity', { message, color }),
  clearActivity:     ()         => Api.delete('/activity'),

  // ── Reports ───────────────────────────────────────────────────
  downloadReport: (property) => {
    const token = Api.getToken();
    window.open(`${API_BASE}/reports/compliance/${encodeURIComponent(property)}?token=${token}`);
  },
};

// Make available globally
window.Api = Api;
