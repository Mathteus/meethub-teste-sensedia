/** Define valor em input controlled pelo React (date/time não reage a .val()). */
function setReactInput(selector: string, value: string) {
  cy.get(selector).then(($el) => {
    const input = $el[0] as HTMLInputElement;
    const setter = Object.getOwnPropertyDescriptor(
      window.HTMLInputElement.prototype,
      "value",
    )?.set;
    setter?.call(input, value);
    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.dispatchEvent(new Event("change", { bubbles: true }));
  });
}

/** Próximo sábado no futuro, em YYYY-MM-DD. */
function nextWeekendISODate(): string {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  while (date.getDay() !== 6) date.setDate(date.getDate() + 1);
  return date.toISOString().slice(0, 10);
}

/** Próximo dia útil no futuro, em YYYY-MM-DD. */
function nextBusinessDayISODate(): string {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  while (date.getDay() === 0 || date.getDay() === 6) {
    date.setDate(date.getDate() + 1);
  }
  return date.toISOString().slice(0, 10);
}

function openCreateDialog() {
  cy.visit("/");
  cy.contains("button", /criar reserva/i).click();
  cy.get("[role=dialog]").should("be.visible");
}

function submit() {
  cy.get('[role="dialog"] button[type="submit"]').click();
}

describe("Reservas em dias úteis e horário comercial", () => {
  beforeEach(() => {
    cy.request("POST", "/api/auth/signin", {
      email: "admin@meethub.com",
      password: "@Admin123",
    }).then((res) => {
      expect(res.status).to.eq(200);
    });
  });

  it("bloqueia reserva no sábado", () => {
    openCreateDialog();
    setReactInput("#startDate", nextWeekendISODate());
    cy.get("#title").type("Reserva de sábado");
    submit();

    cy.contains("dias úteis").should("be.visible");
    cy.get("[role=dialog]").should("be.visible");
  });

  it("bloqueia reserva que terminaria depois das 20:00", () => {
    openCreateDialog();
    setReactInput("#startDate", nextBusinessDayISODate());
    setReactInput("#startTime", "19:30");
    cy.get("#title").type("Reserva fora do expediente");
    submit();

    cy.contains("20:00").should("be.visible");
    cy.get("[role=dialog]").should("be.visible");
  });

  it("bloqueia reserva que começaria antes das 08:00", () => {
    openCreateDialog();
    setReactInput("#startDate", nextBusinessDayISODate());
    setReactInput("#startTime", "07:00");
    cy.get("#title").type("Reserva cedo demais");
    submit();

    cy.contains("08:00").should("be.visible");
  });

  it("permite criar reserva em dia útil dentro do expediente", () => {
    const title = `Reunião válida ${Date.now()}`;
    openCreateDialog();
    cy.get("#title").type(title);
    setReactInput("#startDate", nextBusinessDayISODate());
    setReactInput("#startTime", "10:00");
    submit();

    cy.get("[role=dialog]", { timeout: 30000 }).should("not.exist");
    cy.contains(title).should("be.visible");
  });
});