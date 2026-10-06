describe("Minhas Salas", () => {
  beforeEach(() => {
    cy.request("POST", "/api/auth/signin", {
      email: "maria@meethub.com",
      password: "@User1234",
    }).then((res) => {
      expect(res.status).to.eq(200);
    });
  });

  it("aba 'Todas as Salas' mostra todas as salas", () => {
    cy.visit("/");
    cy.contains("button", "Todas as Salas").click();
    cy.contains("Reunião de planejamento").should("be.visible");
    cy.contains("Daily do backend").should("be.visible");
    cy.contains("Apresentação para cliente").should("be.visible");
  });

  it("aba 'Minhas Salas' mostra somente as reservas da própria usuária", () => {
    cy.visit("/");
    cy.contains("button", "Minhas Salas").click();
    cy.contains("Daily do backend").should("be.visible");
    cy.contains("Reunião de planejamento").should("not.exist");
    cy.contains("Apresentação para cliente").should("not.exist");
  });

  it("usuário comum só vê botão de excluir nas próprias reservas", () => {
    cy.visit("/");
    cy.contains("button", "Todas as Salas").click();

    cy.contains("Daily do backend")
      .parents('[data-slot="card"]')
      .within(() => {
        cy.contains("button", "Cancelar presença").should("exist");
      });

    cy.contains("Reunião de planejamento")
      .parents('[data-slot="card"]')
      .within(() => {
        cy.contains("button", "Cancelar presença").should("not.exist");
      });
  });

  it("usuário comum abre o diálogo de cancelamento da própria reserva", () => {
    cy.visit("/");
    cy.contains("button", "Minhas Salas").click();
    cy.contains("Daily do backend")
      .parents('[data-slot="card"]')
      .within(() => {
        cy.contains("button", "Cancelar presença").click();
      });
    cy.contains("Excluir reserva?").should("be.visible");
    cy.contains('[role="alertdialog"]', "Cancelar").within(() => {
      cy.contains("button", /^Cancelar$/).click();
    });
    cy.contains("Daily do backend").should("be.visible");
  });
});
