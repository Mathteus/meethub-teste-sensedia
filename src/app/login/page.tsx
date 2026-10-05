"use client";

import * as React from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  MailIcon,
  KeyRoundIcon,
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
import { useAuth } from "@/lib/auth/auth-provider";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const signinSchema = z.object({
  email: z.string().email("E-mail inválido"),
  password: z.string().min(1, "Senha é obrigatória"),
});

type SigninForm = z.infer<typeof signinSchema>;

export default function LoginPage() {
  const router = useRouter();
  const { signin, signinError, status } = useAuth();

  React.useEffect(() => {
    if (status === "authenticated") {
      router.replace("/");
    }
  }, [status, router]);

  const [showPassword, setShowPassword] = React.useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SigninForm>({
    resolver: zodResolver(signinSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = handleSubmit(async (data) => {
    await signin(data);
  });

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 p-4">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="text-center space-y-2">
          <CardTitle className="text-3xl font-extrabold tracking-tight">
            <span className="bg-gradient-to-r from-blue-700 to-indigo-700 bg-clip-text text-transparent">
              MeetHub
            </span>
          </CardTitle>
          <CardDescription>Entre na sua conta para continuar</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4" noValidate>
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
                  placeholder="Sua senha"
                  autoComplete="current-password"
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

            {signinError && (
              <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {signinError}
              </div>
            )}

            <Button
              type="submit"
              className="w-full rounded-xl text-base py-5"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2Icon className="animate-spin" /> Entrando...
                </>
              ) : (
                "Entrar"
              )}
            </Button>

            <p className="text-sm text-center text-muted-foreground">
              Ainda não tem uma conta?{" "}
              <Link
                href="/register"
                className="text-primary font-medium underline-offset-4 hover:underline"
              >
                Criar conta
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
