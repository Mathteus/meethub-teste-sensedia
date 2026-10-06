export const BUSINESS_HOUR_START = 8; // 08:00
export const BUSINESS_HOUR_END = 20; // 20:00

export const BUSINESS_HOURS_LABEL = "08:00 às 20:00";

/**
 * Regras de agenda para reservas:
 * - apenas dias úteis (segunda a sexta)
 * - dentro da janela 08:00 - 20:00, considerando o término da reserva
 *
 * Usa os componentes locais da data (fuso do servidor), que é o mesmo
 * fuso usado para persistir e comparar as reservas.
 */
export function isBusinessDay(date: Date): boolean {
  const day = date.getDay(); // 0 domingo ... 6 sábado
  return day >= 1 && day <= 5;
}

export function minutesOfDay(date: Date): number {
  return date.getHours() * 60 + date.getMinutes();
}

export function endOfReservation(startAt: Date, durationMinutes: number): Date {
  return new Date(startAt.getTime() + durationMinutes * 60 * 1000);
}

export type ScheduleViolation =
  | "not-business-day"
  | "before-opening"
  | "after-closing"
  | null;

export function checkSchedule(
  startAt: Date,
  durationMinutes: number,
): ScheduleViolation {
  if (!isBusinessDay(startAt)) return "not-business-day";

  const start = minutesOfDay(startAt);
  const end = minutesOfDay(endOfReservation(startAt, durationMinutes));

  if (start < BUSINESS_HOUR_START * 60) return "before-opening";
  if (end > BUSINESS_HOUR_END * 60) return "after-closing";

  return null;
}

export function scheduleViolationMessage(violation: ScheduleViolation): string {
  switch (violation) {
    case "not-business-day":
      return "Reservas só podem ser feitas de segunda a sexta (dias úteis)";
    case "before-opening":
      return `Reservas só podem começar a partir das ${String(BUSINESS_HOUR_START).padStart(2, "0")}:00`;
    case "after-closing":
      return `A reserva precisa terminar até as ${String(BUSINESS_HOUR_END).padStart(2, "0")}:00`;
    default:
      return "Horário fora do expediente";
  }
}

export function assertSchedule(startAt: Date, durationMinutes: number): void {
  const violation = checkSchedule(startAt, durationMinutes);
  if (violation) {
    throw new Error(scheduleViolationMessage(violation));
  }
}

/** Próximo dia útil a partir de uma data (inclusive), no mesmo horário. */
export function nextBusinessDay(from: Date = new Date()): Date {
  const date = new Date(from);
  while (!isBusinessDay(date)) {
    date.setDate(date.getDate() + 1);
  }
  return date;
}