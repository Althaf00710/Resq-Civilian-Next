export interface CivilianCreateInput {
  name: string;
  nicNumber: string;
  phoneNumber: string;
  email: string;
}

export interface CreateCivilianVars {
  input: CivilianCreateInput;
}

export interface CreateCivilianResponse {
  createCivilian: {
    success: boolean;
    message: string;
  };
}

export interface SendCivilianOtpVars {
  phoneNumber: string;
}

export interface SendCivilianOtpResponse {
  sendCivilianOtp: {
    success: boolean;
    message: string;
  };
}

export interface LoginCivilianVars {
  phoneNumber: string;
  otp: number;
}
export interface LoginCivilianResponse {
  loginCivilian: {
    success: boolean;
    message: string;
    civilian: {
      id: number;
      name: string;
      email: string;
      phoneNumber: string;
      nicNumber: string;
      joinedDate: string;
      isRestrict: boolean;
      civilianStatusId: number;
      civilianStatus: {
        role: string;
      };
    } | null;
  };
}
