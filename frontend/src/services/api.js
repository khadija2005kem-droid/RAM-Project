import { clearAuthSession, getAuthToken } from "../utils/auth";

const API_BASE_URL = "http://localhost:8000/api";

// Helper function to get auth headers
const getAuthHeaders = () => {
  const token = getAuthToken();
  return token ? {
    "Accept": "application/json",
    "Content-Type": "application/json",
    "Authorization": `Bearer ${token}`
  } : {
    "Accept": "application/json",
    "Content-Type": "application/json"
  };
};

const request = async (url, options) => {
  try {
    const response = await fetch(url, options);
    return await parseResponse(response);
  } catch (error) {
    if (error?.status || error?.response || error?.isUnauthorized) {
      throw error;
    }

    const networkError = new Error("Network request failed");
    networkError.isNetworkError = true;
    networkError.cause = error;
    throw networkError;
  }
};

const parseResponse = async (response) => {
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(body.message || "Server error");
    error.status = response.status;
    error.errors = body.errors || {};
    error.body = body;
    error.response = {
      status: response.status,
      data: body
    };

    if (response.status === 401) {
      clearAuthSession();
      error.isUnauthorized = true;
    }

    throw error;
  }
  return body;
};

export const api = {
  // Authentication methods
  login: async (credentials) => {
    return request(`${API_BASE_URL}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(credentials)
    });
  },

  register: async (userData) => {
    return request(`${API_BASE_URL}/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(userData)
    });
  },

  logout: async () => {
    return request(`${API_BASE_URL}/logout`, {
      method: "POST",
      headers: getAuthHeaders()
    });
  },

  getUser: async () => {
    return request(`${API_BASE_URL}/user`, {
      method: "GET",
      headers: getAuthHeaders()
    });
  },

  getProfile: async () => {
    return request(`${API_BASE_URL}/profile`, {
      method: "GET",
      headers: getAuthHeaders()
    });
  },

  updateUser: async (userData) => {
    return request(`${API_BASE_URL}/user`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify(userData)
    });
  },

  dashboard: async () => {
    return request(`${API_BASE_URL}/dashboard`, {
      method: "GET",
      headers: getAuthHeaders()
    });
  },

  facturesAll: async () => {
    return request(`${API_BASE_URL}/factures`, {
      method: "GET",
      headers: getAuthHeaders()
    });
  },

  getFactureById: async (id) => {
    return request(`${API_BASE_URL}/factures/${id}`, {
      method: "GET",
      headers: getAuthHeaders()
    });
  },

  facturesRecent: async () => {
    return request(`${API_BASE_URL}/factures/recent`, {
      method: "GET",
      headers: getAuthHeaders()
    });
  },

  facturesUnseen: async () => {
    return request(`${API_BASE_URL}/factures/unseen`, {
      method: "GET",
      headers: getAuthHeaders()
    });
  },

  activities: async () => {
    return request(`${API_BASE_URL}/activities`, {
      method: "GET",
      headers: getAuthHeaders()
    });
  },

  checkFactureByReference: async (reference) => {
    return request(`${API_BASE_URL}/factures/check/${reference}`, {
      method: "GET",
      headers: getAuthHeaders()
    });
  },

  contactSubmit: async (data) => {
    return request(`${API_BASE_URL}/contact`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
  },

  paiementSubmit: async (data) => {
    return request(`${API_BASE_URL}/paiements`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
  },

  paiementsAll: async () => {
    return request(`${API_BASE_URL}/paiements`, {
      method: "GET",
      headers: getAuthHeaders()
    });
  },

  adminPaiementsAll: async () => {
    return request(`${API_BASE_URL}/admin/paiements`, {
      method: "GET",
      headers: getAuthHeaders()
    });
  },

  adminAcceptPaiement: async (id) => {
    return request(`${API_BASE_URL}/admin/paiements/${id}/accept`, {
      method: "PUT",
      headers: getAuthHeaders()
    });
  },

  adminRejectPaiement: async (id) => {
    return request(`${API_BASE_URL}/admin/paiements/${id}/reject`, {
      method: "PUT",
      headers: getAuthHeaders()
    });
  },

  updateProfile: async (profileData) => {
    return request(`${API_BASE_URL}/profile`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify(profileData)
    });
  },

  updatePassword: async (passwordData) => {
    return request(`${API_BASE_URL}/profile/password`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify(passwordData)
    });
  },

  adminFacturesAll: async () => {
    return request(`${API_BASE_URL}/admin/factures`, {
      method: "GET",
      headers: getAuthHeaders()
    });
  },

  adminCreateFacture: async (factureData) => {
    return request(`${API_BASE_URL}/admin/factures`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(factureData)
    });
  },

  adminValidateFacture: async (id) => {
    return request(`${API_BASE_URL}/admin/factures/${id}/validate`, {
      method: "PUT",
      headers: getAuthHeaders()
    });
  },

  adminGetClientById: async (id) => {
    return request(`${API_BASE_URL}/admin/users/${id}`, {
      method: "GET",
      headers: getAuthHeaders()
    });
  },

  adminMessagesAll: async () => {
    return request(`${API_BASE_URL}/admin/messages`, {
      method: "GET",
      headers: getAuthHeaders()
    });
  },

  adminDashboard: async () => {
    return request(`${API_BASE_URL}/admin/dashboard`, {
      method: "GET",
      headers: getAuthHeaders(),
    });
  },

  adminUsersAll: async () => {
    return request(`${API_BASE_URL}/admin/users?role=client`, {
      method: "GET",
      headers: getAuthHeaders(),
    });
  },

  adminReplyToMessage: async (id, reply) => {
    return request(`${API_BASE_URL}/admin/messages/${id}/reply`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ reply })
    });
  }
};
