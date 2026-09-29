import { describe, expect, it } from "vitest";

import { getPortfolioDates } from "./dates";

describe("getPortfolioDates", () => {
  it("usa o calendário de São Paulo para definir o dia operacional", () => {
    expect(getPortfolioDates(new Date("2026-09-29T02:30:00.000Z"))).toEqual({
      today: "2026-09-28",
      inThirtyDays: "2026-10-28",
    });
  });

  it("calcula corretamente a janela de 30 dias entre anos", () => {
    expect(getPortfolioDates(new Date("2026-12-20T15:00:00.000Z"))).toEqual({
      today: "2026-12-20",
      inThirtyDays: "2027-01-19",
    });
  });
});
