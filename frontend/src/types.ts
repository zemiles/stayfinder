export type UserRole = "USER" | "CORP_USER" | "ADMIN";

export interface StayfinderResponse<T> {
  code: string;
  message: string;
  data: T;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
}

export interface TermsMain {
  termsId: number;
  termsMainTitle: string;
  isTermsRequired: boolean;
}

export interface TermsSub {
  termsDetailsTitle: string;
  termsDetailsContent: string;
  isActive: boolean;
  createAt: string;
}

export interface SignupPayload {
  email: string;
  password: string;
  passwordCheck: string;
  nickName: string;
  phoneNumber: string;
  birthday: string;
  gender: string;
}

export interface CertifyPayload {
  phoneNumber: string;
  reqCertifyNumber?: number;
  termsDtoList?: Array<{
    termsMainId: number;
    isAgreement: boolean;
  }>;
}

export interface SearchResult {
  businessTitle?: string;
  businessCategory?: string;
  businessAddress?: string;
  roomName?: string;
  roomType?: string;
  price?: number;
  availableDate?: string;
  raw?: unknown;
}

export interface ReservationPayload {
  roomId: number;
  roomUnitId?: number;
  checkIn: string;
  checkOut: string;
  amount: number;
  payMethod: "ACCOUNT" | "CARD" | "BANK_PAYMENT";
}

export interface CorpUserPayload {
  email: string;
  password: string;
  passwordConfirm: string;
  corpPhoneNumber: string;
  businessLicense: string;
}

export interface CorpRequestPayload {
  businessName: string;
  businessLicense: string;
  businessAddress: string;
  businessTitle: string;
  businessCategory: string;
}

export interface RoomPayload {
  roomName?: string;
  roomType: string;
  price: number;
  capacity: number;
  roomTypeName?: string;
}

export interface TermsRegisterPayload {
  mainTitle: string;
  subTitle: string;
  detailContent: string;
  isCompulsion: boolean;
  sortSeq: number;
}
