import { apiRequest } from "./client";
import { getAccessToken } from "../auth/tokenStorage";
import type {
  CertifyPayload,
  CorpRequestPayload,
  CorpUserPayload,
  LoginPayload,
  LoginResponse,
  ReservationPayload,
  RoomPayload,
  SearchResult,
  SignupPayload,
  TermsMain,
  TermsRegisterPayload,
  TermsSub
} from "../types";

function toCompactDate(value: string) {
  return value.replace(/-/g, "");
}

export const stayfinderApi = {
  loginUser(payload: LoginPayload) {
    return apiRequest<LoginResponse>("/api/v1/user/login", {
      method: "POST",
      body: JSON.stringify(payload)
    });
  },

  loginCorp(payload: LoginPayload) {
    return apiRequest<LoginResponse>("/api/v1/corp/user/login", {
      method: "POST",
      body: JSON.stringify(payload)
    });
  },

  sendCertify(payload: CertifyPayload) {
    return apiRequest<unknown>("/api/v1/certify/req/send", {
      method: "POST",
      body: JSON.stringify(payload)
    });
  },

  proveCertify(payload: CertifyPayload) {
    return apiRequest<unknown>("/api/v1/certify/num/prove", {
      method: "POST",
      body: JSON.stringify(payload)
    });
  },

  createUser(payload: SignupPayload) {
    return apiRequest<unknown>("/api/v1/users/create", {
      method: "POST",
      body: JSON.stringify(payload)
    });
  },

  getTermsMain() {
    return apiRequest<TermsMain[]>("/api/v1/terms/main");
  },

  getTermsSub(termsMainId: number) {
    return apiRequest<TermsSub[]>(`/api/v1/terms/sub?termsMainId=${termsMainId}`);
  },

  async search(params: { location: string; startDate: string; endDate: string; capacity: number }) {
    const query = new URLSearchParams({
      location: params.location,
      startDate: toCompactDate(params.startDate),
      endDate: toCompactDate(params.endDate),
      capacity: String(params.capacity)
    });
    const data = await apiRequest<unknown[]>(`/api/v1/search?${query.toString()}`);
    return data.map(normalizeSearchResult);
  },

  reserve(payload: ReservationPayload) {
    return apiRequest<unknown>("/api/v1/reservation/create", {
      method: "POST",
      body: JSON.stringify(payload)
    });
  },

  requestCorpApproval(payload: CorpRequestPayload, files: File[]) {
    const formData = new FormData();
    formData.append("data", new Blob([JSON.stringify(payload)], { type: "application/json" }));
    files.forEach((file) => formData.append("files", file));

    return apiRequest<unknown>("/api/v1/corp/request/approval", {
      method: "POST",
      body: formData
    });
  },

  createCorpUser(payload: CorpUserPayload) {
    return apiRequest<unknown>("/api/v1/corp/create", {
      method: "POST",
      body: JSON.stringify(payload)
    });
  },

  createRoom(payload: RoomPayload) {
    return apiRequest<unknown>("/api/v1/room/create", {
      method: "POST",
      body: JSON.stringify(payload)
    });
  },

  createRoomUnit(payload: RoomPayload) {
    return apiRequest<unknown>("/api/v1/room/unit/create", {
      method: "POST",
      headers: { token: getAccessToken() ?? "" },
      body: JSON.stringify(payload)
    });
  },

  registerTerms(payload: TermsRegisterPayload) {
    return apiRequest<unknown>("/api/v1/admin/terms/register", {
      method: "POST",
      body: JSON.stringify(payload)
    });
  },

  approveCorpRequest(payload: { corpUserId: number; requestStatus: "APPROVED" | "REJECTED" }) {
    return apiRequest<unknown>("/api/v1/admin/authority/approved", {
      method: "POST",
      body: JSON.stringify(payload)
    });
  }
};

function normalizeSearchResult(row: unknown): SearchResult {
  if (Array.isArray(row)) {
    return {
      businessTitle: String(row[0] ?? ""),
      businessCategory: String(row[1] ?? ""),
      businessAddress: String(row[2] ?? ""),
      roomName: String(row[3] ?? ""),
      price: Number(row[4] ?? 0),
      availableDate: String(row[5] ?? ""),
      raw: row
    };
  }

  if (row && typeof row === "object") {
    return row as SearchResult;
  }

  return { raw: row };
}
