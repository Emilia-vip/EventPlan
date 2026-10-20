import { request } from "../http";
import type { LoginInput, SignupInput } from "../validation";

export type Role = "customer" | "admin";

export interface UserDto {
  id: string;
  name: string;
  email: string;
  role: Role;
}

export interface Session {
  token: string;
  user: UserDto;
}

export const signup = (input: SignupInput) =>
  request<Session>("/auth/signup", { method: "POST", body: JSON.stringify(input) });

export const login = (input: LoginInput) =>
  request<Session>("/auth/login", { method: "POST", body: JSON.stringify(input) });

export const me = () => request<UserDto>("/auth/me");
