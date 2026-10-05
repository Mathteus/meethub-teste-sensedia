// src/instrumentation.ts

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await startup();
  }
}

async function startup() {
  try {
    console.log("🚀 Starting application...");
    const { validateEnvs, GetEnv } =
      await import("./backend/config/env.validator");

    validateEnvs();
    console.log("✓ Environment variables validated");
    console.log(`✓ Application: ${GetEnv<string>("APPLICATION_NAME")}`);
    console.log(`✓ Environment: ${GetEnv<string>("ENVIRONMENT")}`);
    console.log("✓ Startup checks completed");
  } catch (error) {
    console.error("✗ Startup failed");
    throw error;
  }
}
