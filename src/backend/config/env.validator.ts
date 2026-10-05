import z, { safeParse } from "zod";

export const EnvSchema = z.object({
  PORT: z.coerce.number().positive(),
  HOST: z.string(),
  ENVIRONMENT: z.enum(["development", "production"]),
  COOKIE_SECRET: z.string().min(32),
  APPLICATION_NAME: z.string().min(3),
  SESSION_SECRET: z.string().min(32),
  SESSION_SALT: z.string().min(16),
  REDIS_URL: z.string().optional(),
  JWT_SECRET: z.string().min(32),
  DATABASE_URL: z.string().min(1),
});

export type EnvType = z.infer<typeof EnvSchema>;

let envs: EnvType;

export function validateEnvs() {
  const config = safeParse(EnvSchema, process.env);
  if (config.success) {
    envs = config.data;
    return;
  }

  throw new Error(String(config.error));
}

export function validateEnvsConfig(environments: Record<string, unknown>) {
  const config = safeParse(EnvSchema, environments);
  if (config.success) {
    envs = config.data;
    return config.data;
  }

  throw new Error(String(config.error));
}

export function GetEnv<TypeReturn>(key: keyof EnvType) {
  if (envs) {
    return envs[key] as TypeReturn;
  }

  throw new Error("Inicie as envs primeiro chamando validateEnvs() !");
}
