export interface TraineeRegistrationData {
  firstName: string;
  surname: string;
  middleName?: string;
  dateOfBirth: string;
  gender: 'male' | 'female';
  state: string;
  lga: string;
  email: string;
  phone: string;
  verificationMethod: 'email' | 'phone';
  verificationCode: string;
}

export interface TraineeWithUser {
  id: string;
  userId: string;
  tagNumber: string;
  dateOfBirth: string;
  gender: 'male' | 'female';
  state: string;
  lga: string;
  roomNumber: string | null;
  roomBlock: string | null;
  verificationMethod: 'email' | 'phone';
  user: {
    id: string;
    firstName: string;
    surname: string;
    middleName?: string;
    email: string;
    phone: string;
  };
}

export interface ApiResponse<T = any> {
  message: string;
  data?: T;
  success?: boolean;
}

export interface VerificationResponse {
  success: boolean;
  message: string;
  isExpired?: boolean;
  code?: string; // Only in development
}
