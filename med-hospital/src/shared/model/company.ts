import { Equipment } from "./equipment";

export interface Company {
  id: number;
  name: string;
  equipment: Equipment[];
}