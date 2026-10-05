import { z } from "zod";

const passwordRegex =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':",./<>?|\\~`]).{3,20}$/;

export const signupSchema = z
  .object({
    username: z
      .string()
      .min(3, "Username deve ter no mínimo 3 caracteres")
      .max(100),
    email: z.email("E-mail inválido"),
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

export const signinSchema = z.object({
  email: z.email("E-mail inválido"),
  password: z.string().min(1, "Senha é obrigatória"),
});

export type SignupInput = z.infer<typeof signupSchema>;
export type SigninInput = z.infer<typeof signinSchema>;
