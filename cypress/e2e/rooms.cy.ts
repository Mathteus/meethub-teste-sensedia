describe("Salas", () => {
  beforeEach(() => {
    cy.request("POST", "/api/auth/signin", {
      email: "admin@meethub.com",
      password: "@Admin123",
    }).then((res) => {
      expect(res.status).to.eq(200);
    });
  });

  it("exibe as salas do banco na tela inicial", () => {
    cy.visit("/");
    cy.contains("Reunião de planejamento").should("be.visible");
    cy.contains("Daily do backend").should("be.visible");
    cy.contains("Apresentação para cliente").should("be.visible");
  });

  it("filtra salas pela busca e sincroniza com a URL", () => {
    cy.visit("/");
    cy.get('input[placeholder*="Buscar"]').type("daily");
    cy.url().should("include", "q=daily");
    cy.contains("Daily do backend").should("be.visible");
    cy.contains("Reunião de planejamento").should("not.exist");
  });

  it("filtra salas pela data via URL", () => {
    cy.visit("/?date=2026-10-06");
    cy.contains("Daily do backend").should("be.visible");
    cy.contains("Reunião de planejamento").should("be.visible");
    cy.contains("Apresentação para cliente").should("not.exist");
  });

  it("exibe estado vazio quando nenhum filtro encontra resultados", () => {
    cy.visit("/?q=sala-que-nao-existe");
    cy.contains("Nenhuma reserva encontrada").should("be.visible");
  });

  it("admin consegue abrir o diálogo de criar reserva", () => {
    cy.visit("/");
    cy.contains("button", /criar/i).first().click();
    cy.get("[role=dialog]").should("be.visible");
  });
});
