export function getPortfolioDates(referenceDate = new Date()) {
  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(referenceDate);
  const inThirtyDays = new Date(`${today}T12:00:00Z`);
  inThirtyDays.setUTCDate(inThirtyDays.getUTCDate() + 30);

  return { today, inThirtyDays: inThirtyDays.toISOString().slice(0, 10) };
}
