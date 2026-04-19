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
    const response = await fetch(`${API_BASE_URL}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(credentials)
    });
    return parseResponse(response);
  },

  register: async (userData) => {
    const response = await fetch(`${API_BASE_URL}/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(userData)
    });
    return parseResponse(response);
  },

  logout: async () => {
    const response = await fetch(`${API_BASE_URL}/logout`, {
      method: "POST",
      headers: getAuthHeaders()
    });
    return parseResponse(response);
  },

  getUser: async () => {
    const response = await fetch(`${API_BASE_URL}/user`, {
      method: "GET",
      headers: getAuthHeaders()
    });
    return parseResponse(response);
  },

  getProfile: async () => {
    const response = await fetch(`${API_BASE_URL}/profile`, {
      method: "GET",
      headers: getAuthHeaders()
    });
    return parseResponse(response);
  },

  updateUser: async (userData) => {
    const response = await fetch(`${API_BASE_URL}/user`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify(userData)
    });
    return parseResponse(response);
  },

  dashboard: async () => {
    const response = await fetch(`${API_BASE_URL}/dashboard`, {
      method: "GET",
      headers: getAuthHeaders()
    });
    return parseResponse(response);
  },

  facturesAll: async () => {
    const response = await fetch(`${API_BASE_URL}/factures`, {
      method: "GET",
      headers: getAuthHeaders()
    });
    return parseResponse(response);
  },

  getFactureById: async (id) => {
    const response = await fetch(`${API_BASE_URL}/factures/${id}`, {
      method: "GET",
      headers: getAuthHeaders()
    });
    return parseResponse(response);
  },

  facturesRecent: async () => {
    const response = await fetch(`${API_BASE_URL}/factures/recent`, {
      method: "GET",
      headers: getAuthHeaders()
    });
    return parseResponse(response);
  },

  checkFactureByReference: async (reference) => {
    const response = await fetch(`${API_BASE_URL}/factures/check/${reference}`, {
      method: "GET",
      headers: getAuthHeaders()
    });
    return parseResponse(response);
  },

  contactSubmit: async (data) => {
    const response = await fetch(`${API_BASE_URL}/contact`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    return parseResponse(response);
  },

  paiementSubmit: async (data) => {
    const response = await fetch(`${API_BASE_URL}/paiements`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    return parseResponse(response);
  },

  paiementsAll: async () => {
    const response = await fetch(`${API_BASE_URL}/paiements`, {
      method: "GET",
      headers: getAuthHeaders()
    });
    return parseResponse(response);
  },

  updateProfile: async (profileData) => {
    const response = await fetch(`${API_BASE_URL}/profile`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify(profileData)
    });
    return parseResponse(response);
  },

  updatePassword: async (passwordData) => {
    const response = await fetch(`${API_BASE_URL}/profile/password`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify(passwordData)
    });
    return parseResponse(response);
  },

  adminFacturesAll: async () => {
    const response = await fetch(`${API_BASE_URL}/admin/factures`, {
      method: "GET",
      headers: getAuthHeaders()
    });
    return parseResponse(response);
  },

  adminCreateFacture: async (factureData) => {
    const response = await fetch(`${API_BASE_URL}/admin/factures`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(factureData)
    });
    return parseResponse(response);
  },

  adminValidateFacture: async (id) => {
    const response = await fetch(`${API_BASE_URL}/admin/factures/${id}/validate`, {
      method: "PUT",
      headers: getAuthHeaders()
    });
    return parseResponse(response);
  },

  adminGetClientById: async (id) => {
    const response = await fetch(`${API_BASE_URL}/admin/users/${id}`, {
      method: "GET",
      headers: getAuthHeaders()
    });
    return parseResponse(response);
  },

  adminMessagesAll: async () => {
    const response = await fetch(`${API_BASE_URL}/admin/messages`, {
      method: "GET",
      headers: getAuthHeaders()
    });
    return parseResponse(response);
  }
};
