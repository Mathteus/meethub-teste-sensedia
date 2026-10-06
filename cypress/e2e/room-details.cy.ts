describe("Detalhes da sala", () => {
  beforeEach(() => {
    cy.request("POST", "/api/auth/signin", {
      email: "joao@meethub.com",
      password: "@User1234",
    }).then((res) => {
      expect(res.status).to.eq(200);
    });
  });

  it("clicar no card abre o diálogo com detalhes", () => {
    cy.visit("/");
    cy.contains("Brainstorm de features").click();
    cy.get("[role=dialog]").should("be.visible");
    cy.get("[role=dialog]").within(() => {
      cy.contains("Brainstorm de features").should("be.visible");
      cy.contains("Sala Delta").should("be.visible");
      cy.contains("Participar").should("be.visible");
    });
  });

  it("usuário pode participar de uma sala", () => {
    cy.visit("/");
    cy.contains("Brainstorm de features").click();
    cy.get("[role=dialog]").within(() => {
      cy.contains("button", "Participar").click();
    });
    cy.get("[role=dialog]", { timeout: 30000 }).should("not.exist");
    cy.contains("Brainstorm de features")
      .parents('[data-slot="card"]')
      .should("contain", "joao");
  });

  it("sala em que já participa mostra botão desabilitado", () => {
    cy.visit("/");
    cy.contains("Daily do backend").click();
    cy.get("[role=dialog]").within(() => {
      cy.contains("Você já participa").should("be.visible");
      cy.contains("button", "Participar").should("not.exist");
    });
  });
});
