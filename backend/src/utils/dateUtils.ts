import { min } from "date-fns";

export function isValidDate(value: Date) {
  return value instanceof Date && !Number.isNaN(value.getTime());
}
export function minutesFromTime(value : string){
  const [hours , minutes] = value.split(":").map(Number)
  return hours*60 + minutes
}


