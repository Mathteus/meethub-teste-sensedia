export enum Recurces {
  WIFI = "Wifi",
  PROJECTOR = "Projetor",
  SMART_TV = "Smart Tv",
  CAMERA = "Câmera",
  MIXING_CONSOLE = "Mesa de Som",
  AIR_CONDITIONING = "Ar-Condicionado",
  CHARGERS = "Carregadores",
  LOUSA_INTERATIVA = "Lousa Interativa",
  WHITEBOARD = "Lousa Branca",
  ARMCHAIRS = "Poltronas",
  MINI_FRIDGE = "Frigobar",
}

export interface IRoom {
  id: string;
  title: string;
  description: string;
  participants: string[];
  date: Date;
  maxDurationMinutes?: number;
  resource: Recurces[];
  duration: number;
}
