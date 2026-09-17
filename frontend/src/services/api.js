// The backend URL based on the environment
// We use VITE_API_URL in production, fallback to local dev only in development mode
const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? "http://127.0.0.1:5000/api" : "https://subbhiquiz.onrender.com/api");

const getHeaders = () => {
  const token = localStorage.getItem("quiz_token");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

export const api = {
  // Authentication
  login: async (email, password) => {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || "Login failed");
    }

    localStorage.setItem("quiz_current_user", JSON.stringify(data.user));
    localStorage.setItem("quiz_token", data.token);
    return data;
  },

  register: async (name, email, password) => {
    const response = await fetch(`${API_URL}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || "Registration failed");
    }

    localStorage.setItem("quiz_current_user", JSON.stringify(data.user));
    localStorage.setItem("quiz_token", data.token);
    return data;
  },

  logout: async () => {
    localStorage.removeItem("quiz_current_user");
    localStorage.removeItem("quiz_token");
  },

  getCurrentUser: () => {
    const userStr = localStorage.getItem("quiz_current_user");
    return userStr ? JSON.parse(userStr) : null;
  },

  // Categories & Questions
  getCategories: async () => {
    const response = await fetch(`${API_URL}/quiz/categories`);
    if (!response.ok) throw new Error("Failed to fetch categories");
    return await response.json();
  },

  getQuestions: async (categoryId, difficulty, count = 10) => {
    try {
      const params = new URLSearchParams();
      if (categoryId) params.append("category", categoryId);
      if (difficulty && difficulty !== "all")
        params.append("difficulty", difficulty);
      params.append("limit", count);

      const response = await fetch(
        `${API_URL}/quiz/questions?${params.toString()}`,
      );
      if (!response.ok) throw new Error("Failed to fetch questions");
      const data = await response.json();
      if (!data || data.length === 0) throw new Error("Empty questions");
      return data;
    } catch (err) {
      console.warn("Using dummy questions due to API error:", err);
      return Array(Number(count))
        .fill(0)
        .map((_, i) => ({
          _id: `dummy_${Date.now()}_${i}`,
          category: categoryId || "general",
          difficulty: difficulty === "all" ? "easy" : difficulty,
          question: `Sample dummy question ${i + 1} for ${categoryId || "this topic"}?`,
          options: [
            "Correct Option",
            "Wrong Option 1",
            "Wrong Option 2",
            "Wrong Option 3",
          ],
          correctAnswer: "Correct Option",
          explanation:
            "This is a dummy question loaded because the backend is not returning real questions.",
        }));
    }
  },

  // Quiz Results & History
  submitQuizResult: async (resultData) => {
    const response = await fetch(`${API_URL}/history`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(resultData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to submit result");
    }

    return await response.json();
  },

  getQuizHistory: async () => {
    const response = await fetch(`${API_URL}/history`, {
      headers: getHeaders(),
    });

    if (!response.ok) {
      // If unauthorized, token might be expired
      if (response.status === 401) {
        localStorage.removeItem("quiz_current_user");
        localStorage.removeItem("quiz_token");
      }
      throw new Error("Failed to fetch history");
    }

    return await response.json();
  },
};
