"use client";

import { useState, useEffect } from "react";

interface RealTimeClockProps {
  className?: string;
  showSeconds?: boolean;
}

export function RealTimeClock({
  className,
  showSeconds = true,
}: RealTimeClockProps) {
  const [date, setDate] = useState<Date | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDate(new Date());

    const timer = setInterval(() => {
      setDate(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Previne erro de hidratação (SSR)
  if (!date) {
    return <span className={className}>Carregando...</span>;
  }

  // Formata a data (ex: "segunda-feira, 5 de outubro de 2026")
  const formattedDate = new Intl.DateTimeFormat("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);

  // Formata o horário (ex: "14:30:45")
  const formattedTime = new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
    second: showSeconds ? "2-digit" : undefined,
    hour12: false,
  }).format(date);

  return (
    <div
      className={`flex flex-col sm:flex-row items-baseline gap-1.5 ${className}`}
    >
      <span className="capitalize text-muted-foreground">{formattedDate}</span>
      <span className="text-muted-foreground hidden sm:inline">•</span>
      <span className="font-semibold text-foreground">{formattedTime}</span>
    </div>
  );
}
