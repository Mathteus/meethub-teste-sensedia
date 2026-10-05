"use client";

import * as React from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  UserIcon,
  MailIcon,
  KeyRoundIcon,
  ShieldIcon,
  Loader2Icon,
  EyeIcon,
  EyeOffIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Field, FieldError } from "@/components/ui/field";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";
import { useAuth, type Role } from "@/lib/auth/auth-provider";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

const passwordRegex =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':",./<>?|\\~`]).{3,20}$/;

const signupSchema = z
  .object({
    username: z.string().min(3, "Username deve ter no mínimo 3 caracteres").max(100),
    email: z.string().email("E-mail inválido"),
    password: z
      .string()
      .refine(
        (value) => passwordRegex.test(value),
        "Senha deve ter 3-20 caracteres, 1 maiúscula, 1 minúscula, 1 número e 1 símbolo",
      ),
    confirmPassword: z.string(),
    role: z.enum(["USER", "ADMIN"]).default("USER"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Senhas não conferem",
    path: ["confirmPassword"],
  });

type SignupForm = z.infer<typeof signupSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const { signup, signupError, status } = useAuth();

  React.useEffect(() => {
    if (status === "authenticated") {
      router.replace("/");
    }
  }, [status, router]);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<SignupForm>({
    resolver: zodResolver(signupSchema),
    defaultValues: { email: "", username: "", password: "", confirmPassword: "", role: "USER" },
  });

  const roleValue = watch("role");
  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);

  const onSubmit = handleSubmit(async (data) => {
    await signup(data);
  });

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 p-4 py-8">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="text-center space-y-2">
          <CardTitle className="text-3xl font-extrabold tracking-tight">
            <span className="bg-gradient-to-r from-blue-700 to-indigo-700 bg-clip-text text-transparent">
              MeetHub
            </span>
          </CardTitle>
          <CardDescription>Crie sua conta e comece a usar</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4" noValidate>
            <Tabs
              value={roleValue}
              onValueChange={(value) => setValue("role", value as Role, { shouldValidate: true })}
            >
              <TabsList className="w-full grid grid-cols-2">
                <TabsTrigger value="USER" className="gap-2">
                  <UserIcon className="size-4" /> Usuário
                </TabsTrigger>
                <TabsTrigger value="ADMIN" className="gap-2">
                  <ShieldIcon className="size-4" /> Admin
                </TabsTrigger>
              </TabsList>
              <TabsContent value="USER" className="pt-4 space-y-4" />
              <TabsContent value="ADMIN" className="pt-4 space-y-4" />
            </Tabs>

            <Field>
              <Label htmlFor="username">Nome de usuário</Label>
              <InputGroup>
                <InputGroupAddon>
                  <UserIcon className="size-4" />
                </InputGroupAddon>
                <InputGroupInput
                  id="username"
                  type="text"
                  placeholder="Seu nome de usuário"
                  autoComplete="username"
                  {...register("username")}
                />
              </InputGroup>
              <FieldError errors={[errors.username]} />
            </Field>

            <Field>
              <Label htmlFor="email">E-mail</Label>
              <InputGroup>
                <InputGroupAddon>
                  <MailIcon className="size-4" />
                </InputGroupAddon>
                <InputGroupInput
                  id="email"
                  type="email"
                  placeholder="voce@exemplo.com"
                  autoComplete="email"
                  {...register("email")}
                />
              </InputGroup>
              <FieldError errors={[errors.email]} />
            </Field>

            <Field>
              <Label htmlFor="password">Senha</Label>
              <InputGroup>
                <InputGroupAddon>
                  <KeyRoundIcon className="size-4" />
                </InputGroupAddon>
                <InputGroupInput
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Senha forte"
                  autoComplete="new-password"
                  {...register("password")}
                />
                <InputGroupAddon align="inline-end">
                  <InputGroupButton
                    type="button"
                    size="icon-xs"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                  >
                    {showPassword ? (
                      <EyeOffIcon className="size-4" />
                    ) : (
                      <EyeIcon className="size-4" />
                    )}
                  </InputGroupButton>
                </InputGroupAddon>
              </InputGroup>
              <FieldError errors={[errors.password]} />
            </Field>

            <Field>
              <Label htmlFor="confirmPassword">Confirmar senha</Label>
              <InputGroup>
                <InputGroupAddon>
                  <KeyRoundIcon className="size-4" />
                </InputGroupAddon>
                <InputGroupInput
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Repita a senha"
                  autoComplete="new-password"
                  {...register("confirmPassword")}
                />
                <InputGroupAddon align="inline-end">
                  <InputGroupButton
                    type="button"
                    size="icon-xs"
                    onClick={() => setShowConfirmPassword((v) => !v)}
                    aria-label={
                      showConfirmPassword ? "Ocultar senha" : "Mostrar senha"
                    }
                  >
                    {showConfirmPassword ? (
                      <EyeOffIcon className="size-4" />
                    ) : (
                      <EyeIcon className="size-4" />
                    )}
                  </InputGroupButton>
                </InputGroupAddon>
              </InputGroup>
              <FieldError errors={[errors.confirmPassword]} />
            </Field>

            {signupError && (
              <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {signupError}
              </div>
            )}

            <Button
              type="submit"
              className="w-full rounded-xl text-base py-5"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2Icon className="animate-spin" /> Criando conta...
                </>
              ) : (
                "Criar conta"
              )}
            </Button>

            <p className="text-sm text-center text-muted-foreground">
              Já tem uma conta?{" "}
              <Link
                href="/login"
                className="text-primary font-medium underline-offset-4 hover:underline"
              >
                Fazer login
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
