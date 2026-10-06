import { defineConfig } from "cypress";

export default defineConfig({
  e2e: {
    baseUrl: "http://localhost:3333",
    specPattern: "cypress/e2e/**/*.cy.ts",
    supportFile: false,
    setupNodeEvents(on) {
      // O teste de "participar" altera participants no banco, então
      // restauramos o seed antes de cada spec para torná-los repetíveis.
      on("before:run", () => {
        const { execSync } = require("node:child_process");
        execSync(
          'docker exec next_postgres psql -U next_user -d next_db -c "TRUNCATE accounts, rooms;"',
          { stdio: "ignore" },
        );
        execSync("bun run seed", { stdio: "ignore" });
      });
    },
    defaultCommandTimeout: 15000,
    requestTimeout: 60000,
    pageLoadTimeout: 120000,
    video: false,
  },
});
