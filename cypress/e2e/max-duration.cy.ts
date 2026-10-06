describe("Duração Máxima por Sala", () => {
  beforeEach(() => {
    cy.request("POST", "/api/auth/signin", {
      email: "admin@meethub.com",
      password: "@Admin123",
    });
  });

  it("exibe a duração máxima personalizada em cada card na listagem", () => {
    cy.visit("/");

    // Verifica que os cards exibem a badge/informação com a duração máxima de cada sala
    cy.contains("Reunião de planejamento")
      .parents('[data-slot="card"]')
      .should("contain", "4h máx");

    cy.contains("Daily do backend")
      .parents('[data-slot="card"]')
      .should("contain", "2h máx");

    cy.contains("Apresentação para cliente")
      .parents('[data-slot="card"]')
      .should("contain", "8h máx");
  });

  it("exibe o limite da sala no diálogo de detalhes ao clicar no card", () => {
    cy.visit("/");

    cy.contains("Daily do backend").click();
    cy.get("[role=dialog]").should("be.visible");
    cy.get("[role=dialog]").within(() => {
      cy.contains("Daily do backend").should("be.visible");
      cy.contains("Limite desta sala: 120 min").should("be.visible");
    });
  });

  it("admin pode criar uma reserva com duração acima do limite anterior fixo de 4h (ex: 8 horas)", () => {
    cy.visit("/");

    cy.contains("button", /criar reserva/i).click();
    cy.get("[role=dialog]").should("be.visible");

    const uniqueTitle = `Workshop Intensivo ${Date.now()}`;
    cy.get("#title").type(uniqueTitle);

    // Ajusta o limite máximo da sala para 8 horas (480 minutos)
    cy.get('[data-testid="max-duration-trigger"]').click();
    cy.contains('[data-slot="select-option"]', "8 horas").click({ force: true });

    // Seleciona a duração da reserva (ex: 4 horas)
    cy.get('[data-testid="duration-trigger"]').click();
    cy.contains('[data-slot="select-option"]', "4 horas").click({ force: true });

    cy.get('button[type="submit"]').click();

    // Diálogo deve fechar e a nova sala deve ser listada com o limite correto
    cy.get("[role=dialog]").should("not.exist");
    cy.contains(uniqueTitle).should("be.visible");
    cy.contains(uniqueTitle)
      .parents('[data-slot="card"]')
      .should("contain", "8h máx");
  });

  it("diálogo de criação ajusta opções de duração conforme a duração máxima selecionada", () => {
    cy.visit("/");

    cy.contains("button", /criar reserva/i).click();
    cy.get("[role=dialog]").should("be.visible");

    // Define limite máximo da sala como 30 minutos
    cy.get('[data-testid="max-duration-trigger"]').click();
    cy.contains('[data-slot="select-option"]', "30 minutos").click({ force: true });

    // Ao abrir o seletor de duração, não devem aparecer opções maiores que 30 minutos (como 2 horas, 4 horas)
    cy.get('[data-testid="duration-trigger"]').click();
    cy.contains('[data-slot="select-option"]', "30 minutos").should("be.visible");
    cy.contains('[data-slot="select-option"]', "15 minutos").should("be.visible");
    cy.contains('[data-slot="select-option"]', "2 horas").should("not.exist");
    cy.contains('[data-slot="select-option"]', "4 horas").should("not.exist");
  });
});
