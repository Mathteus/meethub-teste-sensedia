import { describe, it, expect } from "vitest";
import {
  BUSINESS_HOUR_END,
  BUSINESS_HOUR_START,
  checkSchedule,
  endOfReservation,
  isBusinessDay,
  minutesOfDay,
  nextBusinessDay,
  scheduleViolationMessage,
} from "./schedule";

/** Cria uma data local (evita depender do fuso do ambiente). */
function local(y: number, m: number, d: number, h = 0, min = 0) {
  return new Date(y, m - 1, d, h, min, 0, 0);
}

describe("isBusinessDay", () => {
  it("aceita de segunda a sexta", () => {
    // 05/10/2026 segunda ... 09/10/2026 sexta
    for (let day = 5; day <= 9; day++) {
      expect(isBusinessDay(local(2026, 10, day))).toBe(true);
    }
  });

  it("rejeita sábado e domingo", () => {
    expect(isBusinessDay(local(2026, 10, 10))).toBe(false); // sábado
    expect(isBusinessDay(local(2026, 10, 11))).toBe(false); // domingo
  });
});

describe("minutesOfDay / endOfReservation", () => {
  it("converte a hora em minutos", () => {
    expect(minutesOfDay(local(2026, 10, 5, 8, 30))).toBe(510);
  });

  it("calcula o término da reserva", () => {
    const start = local(2026, 10, 5, 9, 0);
    const end = endOfReservation(start, 90);
    expect(end.getHours()).toBe(10);
    expect(end.getMinutes()).toBe(30);
  });
});

describe("checkSchedule", () => {
  it("aceita dia útil dentro do expediente", () => {
    expect(checkSchedule(local(2026, 10, 6, 14, 0), 60)).toBeNull();
  });

  it("aceita o limite exato de 08:00", () => {
    expect(checkSchedule(local(2026, 10, 6, 8, 0), 15)).toBeNull();
  });

  it("aceita reserva que termina exatamente às 20:00", () => {
    expect(checkSchedule(local(2026, 10, 6, 19, 0), 60)).toBeNull();
  });

  it("rejeita sábado e domingo", () => {
    expect(checkSchedule(local(2026, 10, 10, 14, 0), 60)).toBe(
      "not-business-day",
    );
    expect(checkSchedule(local(2026, 10, 11, 14, 0), 60)).toBe(
      "not-business-day",
    );
  });

  it("rejeita início antes das 08:00", () => {
    expect(checkSchedule(local(2026, 10, 6, 7, 59), 15)).toBe(
      "before-opening",
    );
  });

  it("rejeita término depois das 20:00", () => {
    expect(checkSchedule(local(2026, 10, 6, 19, 30), 60)).toBe(
      "after-closing",
    );
  });

  it("prioriza o dia útil sobre o horário", () => {
    expect(checkSchedule(local(2026, 10, 10, 3, 0), 15)).toBe(
      "not-business-day",
    );
  });

  it("usa a janela configurada 08:00-20:00", () => {
    expect(BUSINESS_HOUR_START).toBe(8);
    expect(BUSINESS_HOUR_END).toBe(20);
  });
});

describe("scheduleViolationMessage", () => {
  it("retorna mensagens legíveis para cada violação", () => {
    expect(scheduleViolationMessage("not-business-day")).toContain(
      "dias úteis",
    );
    expect(scheduleViolationMessage("before-opening")).toContain("08:00");
    expect(scheduleViolationMessage("after-closing")).toContain("20:00");
  });
});

describe("nextBusinessDay", () => {
  it("pula o fim de semana", () => {
    // sábado 10/10/2026 -> segunda 12/10/2026
    const next = nextBusinessDay(local(2026, 10, 10, 12, 0));
    expect(next.getDay()).toBe(1);
    expect(next.getDate()).toBe(12);
  });

  it("mantém o dia se já for útil", () => {
    const same = nextBusinessDay(local(2026, 10, 7, 12, 0));
    expect(same.getDate()).toBe(7);
  });
});