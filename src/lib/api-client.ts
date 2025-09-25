// API Client - Single responsibility: HTTP communication with backend
export class ApiClient {
  private baseUrl: string;

  constructor(baseUrl?: string) {
    // Use environment variable if available, otherwise fall back to provided baseUrl or '/api'
    this.baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || baseUrl || "/api";
  }

  private async request<T>(
    endpoint: string,
    options?: RequestInit
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;

    const response = await fetch(url, {
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
      ...options,
    });

    if (!response.ok) {
      const error = await response
        .json()
        .catch(() => ({ message: "Network error" }));

      // If it's an authentication error, provide more specific message
      if (response.status === 401) {
        throw new Error("Authentication required. Please log in again.");
      }

      throw new Error(error.message || `HTTP ${response.status}`);
    }

    return response.json();
  }

  async logout() {
    return this.request("/auth/logout", {
      method: "POST",
      body: JSON.stringify({}),
    });
  }

  async verifyAuth() {
    return this.request("/auth/verify");
  }

  // Player methods
  async getPlayers(params?: {
    search?: string;
    gender?: string;
    ageGroup?: string;
    page?: number;
    limit?: number;
  }) {
    const searchParams = new URLSearchParams();
    if (params?.search) searchParams.set("search", params.search);
    if (params?.gender) searchParams.set("gender", params.gender);
    if (params?.ageGroup) searchParams.set("ageGroup", params.ageGroup);
    if (params?.page) searchParams.set("page", params.page.toString());
    if (params?.limit) searchParams.set("limit", params.limit.toString());

    const query = searchParams.toString();
    return this.request(`/players${query ? `?${query}` : ""}`);
  }

  async getPlayer(id: string) {
    return this.request(`/players/${id}`);
  }

  async createPlayer(data: any) {
    return this.request("/players", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async updatePlayer(id: string, data: any) {
    return this.request(`/players/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  async deletePlayer(id: string) {
    return this.request(`/players/${id}`, {
      method: "DELETE",
    });
  }

  // Test methods
  async getTests(params?: {
    q?: string;
    playingTime?: number;
    recoveryTime?: number;
    dateFrom?: string;
    dateTo?: string;
    page?: number;
    limit?: number;
  }) {
    const searchParams = new URLSearchParams();
    if (params?.q) searchParams.set("q", params.q);
    if (params?.playingTime)
      searchParams.set("playingTime", params.playingTime.toString());
    if (params?.recoveryTime)
      searchParams.set("recoveryTime", params.recoveryTime.toString());
    if (params?.dateFrom) searchParams.set("dateFrom", params.dateFrom);
    if (params?.dateTo) searchParams.set("dateTo", params.dateTo);
    if (params?.page) searchParams.set("page", params.page.toString());
    if (params?.limit) searchParams.set("limit", params.limit.toString());

    const query = searchParams.toString();
    return this.request(`/tests${query ? `?${query}` : ""}`);
  }

  async getTest(id: string, includeResults?: boolean) {
    const params = includeResults ? "?includeResults=true" : "";
    return this.request(`/tests/${id}${params}`);
  }

  async createTest(data: any) {
    return this.request("/tests", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async updateTest(id: string, data: any) {
    return this.request(`/tests/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  async deleteTest(id: string) {
    return this.request(`/tests/${id}`, {
      method: "DELETE",
    });
  }

  // Results methods
  async getResults() {
    return this.request("/results");
  }

  async getPlayerResults(playerId: string) {
    return this.request(`/results/player/${playerId}`);
  }

  async getTestResults(testId: string) {
    return this.request(`/results/test/${testId}`);
  }

  async createResult(data: any) {
    return this.request("/results", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async updateResult(id: string, data: any) {
    return this.request(`/results/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  async deleteResult(id: string) {
    return this.request(`/results/${id}`, {
      method: "DELETE",
    });
  }

  // Generic methods for convenience
  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint);
  }

  async post<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: "POST",
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: "PUT",
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, {
      method: "DELETE",
    });
  }
}

// Singleton instance - use environment variable only
const defaultApiUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

if (!defaultApiUrl) {
  throw new Error(
    "NEXT_PUBLIC_API_BASE_URL environment variable is required. " +
      "Please set it in your .env file."
  );
}

export const apiClient = new ApiClient(defaultApiUrl);
