/**
 * Identity domain contracts for Origin (Out-of-Scope).
 */
export type UserKind = "guest" | "user";

export interface CreditsState {
  missionsRemaining: number | null;
  questionsRemaining: number | null;
  agentMessagesRemaining: number | null;
}

export interface UserProfile {
  id: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  avatarUrl?: string;
}

export type UsageErrorCode = "CREDITS_EXHAUSTED";

export interface UsageError {
  code: UsageErrorCode;
  message: string;
  credits?: CreditsState;
}

export interface OriginMeResponse {
  userKind: UserKind;
  profile?: UserProfile;
  credits: CreditsState;
}

export interface ClaimGuestResponse {
  success: boolean;
  claimed: boolean;
}
