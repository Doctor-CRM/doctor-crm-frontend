import api from "./api";
import type {
  GetUserDataResponse,
  UpdateUserPayload,
  UpdateUserResponse,
  GetDoctorDataResponse,
  DoctorProfile,
  SaveDoctorProfilePayload,
  GetPatientDataResponse,
  PatientProfile,
  SavePatientProfilePayload,
  HealthCheckResponse,
} from "../types/admin";

export const adminService = {
  /**
   * Fetch all system users and summary statistics (Admin Only)
   * Endpoint: GET /api/v1/user/data (fallback: /api/v1/users/data, /api/v1/users)
   */
  getUserData: async (): Promise<GetUserDataResponse> => {
    try {
      const response = await api.get<GetUserDataResponse>("/api/v1/user/data");
      return response.data;
    } catch {
      try {
        const response = await api.get<GetUserDataResponse>("/api/v1/users/data");
        return response.data;
      } catch {
        const response = await api.get<GetUserDataResponse>("/api/v1/users");
        return response.data;
      }
    }
  },

  /**
   * Update user details, role, status & action (Admin Only)
   * Endpoint: POST /api/v1/user/update (fallback: /api/v1/users/update)
   */
  updateUser: async (payload: UpdateUserPayload): Promise<UpdateUserResponse> => {
    try {
      const response = await api.post<UpdateUserResponse>(
        "/api/v1/user/update",
        payload
      );
      return response.data;
    } catch {
      const response = await api.post<UpdateUserResponse>(
        "/api/v1/users/update",
        payload
      );
      return response.data;
    }
  },

  /**
   * Fetch Doctor Profile / Data List
   * Endpoint: GET /api/v1/doctor/data (fallback: /api/v1/doctor/profile, /api/v1/doctors/data)
   */
  getDoctorData: async (userId?: number | string): Promise<DoctorProfile[]> => {
    const params = userId ? { user_id: userId } : {};
    let rawData: GetDoctorDataResponse | null = null;

    try {
      const response = await api.get<GetDoctorDataResponse>("/api/v1/doctor/data", { params });
      rawData = response.data;
    } catch {
      try {
        const response = await api.get<GetDoctorDataResponse>("/api/v1/doctor/profile", { params });
        rawData = response.data;
      } catch {
        const response = await api.get<GetDoctorDataResponse>("/api/v1/doctors/data", { params });
        rawData = response.data;
      }
    }

    if (!rawData || !rawData.data) return [];
    if (Array.isArray(rawData.data)) {
      return rawData.data;
    }
    return [rawData.data];
  },

  /**
   * Save / Create / Update Doctor Profile in DB
   * Endpoint: POST /api/v1/doctor/profile (fallback: /api/v1/doctors/profile)
   */
  saveDoctorProfile: async (payload: SaveDoctorProfilePayload) => {
    try {
      const response = await api.post("/api/v1/doctor/profile", payload);
      return response.data;
    } catch {
      const response = await api.post("/api/v1/doctors/profile", payload);
      return response.data;
    }
  },

  /**
   * Fetch Patient Profile / Data List
   * Endpoint: GET /api/v1/patient/data (fallback: /api/v1/patient/profile, /api/v1/patients/data)
   */
  getPatientData: async (userId?: number | string): Promise<PatientProfile[]> => {
    const params = userId ? { user_id: userId } : {};
    let rawData: GetPatientDataResponse | null = null;

    try {
      const response = await api.get<GetPatientDataResponse>("/api/v1/patient/data", { params });
      rawData = response.data;
    } catch {
      try {
        const response = await api.get<GetPatientDataResponse>("/api/v1/patient/profile", { params });
        rawData = response.data;
      } catch {
        const response = await api.get<GetPatientDataResponse>("/api/v1/patients/data", { params });
        rawData = response.data;
      }
    }

    if (!rawData || !rawData.data) return [];
    if (Array.isArray(rawData.data)) {
      return rawData.data;
    }
    return [rawData.data];
  },

  /**
   * Save / Create / Update Patient Profile in DB
   * Endpoint: POST /api/v1/patient/profile (fallback: /api/v1/patients/profile)
   */
  savePatientProfile: async (payload: SavePatientProfilePayload) => {
    try {
      const response = await api.post("/api/v1/patient/profile", payload);
      return response.data;
    } catch {
      const response = await api.post("/api/v1/patients/profile", payload);
      return response.data;
    }
  },

  /**
   * Check backend health status
   * Endpoint: GET /api/v1/health
   */
  checkHealth: async (): Promise<HealthCheckResponse> => {
    const response = await api.get<HealthCheckResponse>("/api/v1/health");
    return response.data;
  },
};
