"use client";

import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

export type Role = "USER" | "ADMIN";

export interface AuthUser {
  id: string;
  username: string;
  email: string;
  role: Role;
  createdAt: string | Date;
}

interface AuthContextValue {
  user: AuthUser | null;
  status: "loading" | "authenticated" | "unauthenticated";
  signin: (data: { email: string; password: string }) => Promise<void>;
  signup: (data: {
    username: string;
    email: string;
    password: string;
    confirmPassword: string;
    role?: Role;
  }) => Promise<void>;
  signout: () => Promise<void>;
  signinError: string | null;
  signupError: string | null;
}

const AuthContext = React.createContext<AuthContextValue | undefined>(
  undefined,
);

async function fetchMe(): Promise<AuthUser | null> {
  const res = await fetch("/api/auth/me", {
    method: "GET",
    credentials: "include",
  });
  if (res.status === 401) return null;
  if (!res.ok) throw new Error("Falha ao carregar sessão");
  const data = await res.json();
  return data.account;
}

async function doSignin(body: {
  email: string;
  password: string;
}): Promise<AuthUser> {
  const res = await fetch("/api/auth/signin", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message ?? "Credenciais inválidas");
  }
  return data.account;
}

async function doSignup(body: {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  role?: Role;
}): Promise<AuthUser> {
  const res = await fetch("/api/auth/signup", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) {
    if (data.errors) {
      const first = Object.values(data.errors).flat()[0] as string | undefined;
      throw new Error(first ?? data.message ?? "Dados inválidos");
    }
    throw new Error(data.message ?? "Erro ao cadastrar");
  }
  return data.account;
}

async function doSignout(): Promise<void> {
  await fetch("/api/auth/signout", {
    method: "POST",
    credentials: "include",
  });
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [signinError, setSigninError] = React.useState<string | null>(null);
  const [signupError, setSignupError] = React.useState<string | null>(null);

  const meQuery = useQuery({
    queryKey: ["auth", "me"],
    queryFn: fetchMe,
    staleTime: 1000 * 60 * 30,
    retry: 0,
  });

  const signinMutation = useMutation({
    mutationFn: doSignin,
    onSuccess: (user) => {
      queryClient.setQueryData(["auth", "me"], user);
      setSigninError(null);
      router.refresh();
      router.push("/");
    },
    onError: (err: Error) => setSigninError(err.message),
  });

  const signupMutation = useMutation({
    mutationFn: doSignup,
    onSuccess: (user) => {
      queryClient.setQueryData(["auth", "me"], user);
      setSignupError(null);
      router.refresh();
      router.push("/");
    },
    onError: (err: Error) => setSignupError(err.message),
  });

  const signoutMutation = useMutation({
    mutationFn: doSignout,
    onSuccess: () => {
      queryClient.setQueryData(["auth", "me"], null);
      queryClient.clear();
      router.refresh();
      router.push("/login");
    },
  });

  const status: AuthContextValue["status"] = meQuery.isLoading
    ? "loading"
    : meQuery.data
      ? "authenticated"
      : "unauthenticated";

  const value: AuthContextValue = {
    user: meQuery.data ?? null,
    status,
    signin: (data) => signinMutation.mutateAsync(data),
    signup: (data) => signupMutation.mutateAsync(data),
    signout: () => signoutMutation.mutateAsync(),
    signinError,
    signupError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = React.useContext(AuthContext);
  if (!ctx) throw new Error("useAuth deve ser usado dentro de AuthProvider");
  return ctx;
}
