import { GetEnv, validateEnvs } from "@/backend/config/env.validator";

export async function GET() {
  try {
    validateEnvs();
    const applicationName = GetEnv<string>("APPLICATION_NAME");
    const environment = GetEnv<string>("ENVIRONMENT");

    return Response.json({
      status: "ok",
      application: applicationName,
      environment,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return Response.json(
      {
        status: "error",
        message: "Environment variables not validated",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
