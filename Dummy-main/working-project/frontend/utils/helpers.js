import { CURRENCY } from "./constants";

export function formatCurrency(amount) {
  return `${CURRENCY}${amount}`;
}
