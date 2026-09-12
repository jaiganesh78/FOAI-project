export interface UserPayloadDto {
  id: string;
  email: string;
  fullName: string;
  status: string;
  roles: string[];
  permissions: string[];
}

export interface AuthTokensDto {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface AuthResponseDto {
  user: UserPayloadDto;
  tokens: AuthTokensDto;
}

export interface SessionItemDto {
  id: string;
  deviceName?: string;
  platform?: string;
  browser?: string;
  operatingSystem?: string;
  ipAddress?: string;
  lastActivityAt: string;
  isCurrent: boolean;
  createdAt: string;
}
