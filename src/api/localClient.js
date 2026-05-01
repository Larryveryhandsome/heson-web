/**
 * HESON 本機 API 客戶端
 * 介面完全相容原本的 Base44 SDK，頁面元件不需要修改
 */

const API_BASE = import.meta.env.VITE_API_BASE || '/api';
const TOKEN_KEY = 'heson_token';

function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

function setToken(token) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

async function apiFetch(path, options = {}) {
  const token = getToken();
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  let data;
  try {
    data = await res.json();
  } catch {
    data = {};
  }

  if (!res.ok) {
    const err = new Error(data.error || data.message || `HTTP ${res.status}`);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

// ────────────────────────────────────
// Auth 模組
// ────────────────────────────────────
const auth = {
  async me() {
    return apiFetch('/auth/me');
  },

  async isAuthenticated() {
    if (!getToken()) return false;
    try {
      await apiFetch('/auth/me');
      return true;
    } catch {
      return false;
    }
  },

  redirectToLogin(redirectUrl) {
    const redirect = redirectUrl ? `?redirect=${encodeURIComponent(redirectUrl)}` : '';
    window.location.href = `/Login${redirect}`;
  },

  logout() {
    setToken(null);
    window.location.href = '/Login';
  },

  // 登入（供 Login 頁面使用）
  async login(email, password) {
    const data = await apiFetch('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    setToken(data.token);
    return data.user;
  },

  // 註冊
  async register(email, password, full_name) {
    const data = await apiFetch('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, full_name }),
    });
    setToken(data.token);
    return data.user;
  },

  // 設定初始管理員（第一次使用）
  async setupAdmin(email, password, full_name) {
    const data = await apiFetch('/auth/setup-admin', {
      method: 'POST',
      body: JSON.stringify({ email, password, full_name }),
    });
    setToken(data.token);
    return data.user;
  },

  // Google 登入（同 email 自動合併帳號）
  async googleLogin(credential) {
    const data = await apiFetch('/auth/google', {
      method: 'POST',
      body: JSON.stringify({ credential }),
    });
    setToken(data.token);
    return data.user;
  },

  setToken,
  getToken,
};

// ────────────────────────────────────
// Entity 模組（通用 CRUD）
// ────────────────────────────────────
function makeEntityClient(entityName) {
  return {
    async create(data) {
      return apiFetch(`/entities/${entityName}`, {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },

    async filter(filters = {}, options = {}) {
      const params = new URLSearchParams();
      if (filters) {
        // Base44 filter 格式：{ field: { eq: value } } 或 { field: value }
        for (const [key, val] of Object.entries(filters)) {
          if (val !== null && val !== undefined) {
            const v = typeof val === 'object' && val.eq !== undefined ? val.eq : val;
            params.set(key, v);
          }
        }
      }
      if (options.sort) params.set('_sort', options.sort);
      if (options.order) params.set('_order', options.order);
      if (options.limit) params.set('_limit', options.limit);
      if (options.offset) params.set('_offset', options.offset);

      const qs = params.toString();
      return apiFetch(`/entities/${entityName}${qs ? `?${qs}` : ''}`);
    },

    // Base44 相容：list(sort, limit)
    // sort 格式：'-created_date'（降冪）或 'created_date'（升冪）
    async list(sort, limit) {
      const params = new URLSearchParams();
      if (sort) {
        const desc = sort.startsWith('-');
        params.set('_sort', desc ? sort.slice(1) : sort);
        params.set('_order', desc ? 'desc' : 'asc');
      }
      if (limit) params.set('_limit', limit);
      const qs = params.toString();
      return apiFetch(`/entities/${entityName}${qs ? `?${qs}` : ''}`);
    },

    async get(id) {
      return apiFetch(`/entities/${entityName}/${id}`);
    },

    async update(id, data) {
      return apiFetch(`/entities/${entityName}/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    },

    async delete(id) {
      return apiFetch(`/entities/${entityName}/${id}`, {
        method: 'DELETE',
      });
    },
  };
}

const entities = new Proxy({}, {
  get(_, entityName) {
    return makeEntityClient(entityName);
  },
});

// ────────────────────────────────────
// Functions 模組
// ────────────────────────────────────
const functions = {
  async invoke(name, data) {
    const result = await apiFetch(`/functions/${name}`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return { data: result };
  },
};

// ────────────────────────────────────
// Integrations 模組（相容原 Base44 SDK）
// ────────────────────────────────────
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

const integrations = {
  Core: {
    async UploadFile({ file }) {
      if (!file) throw new Error('未提供檔案');
      const data = await fileToBase64(file);
      const result = await apiFetch('/upload', {
        method: 'POST',
        body: JSON.stringify({ filename: file.name, mimetype: file.type, data }),
      });
      return result; // { file_url }
    },
    async SendEmail({ to, subject, body } = {}) {
      return apiFetch('/contact', {
        method: 'POST',
        body: JSON.stringify({ to, subject, body }),
      });
    },
  },
};

// ────────────────────────────────────
// 整合 client（對外介面與 Base44 SDK 相同）
// ────────────────────────────────────
export const hesonClient = {
  auth,
  entities,
  functions,
  integrations,
};

// 相容舊的 base44 名稱
export const base44 = hesonClient;
export default hesonClient;
