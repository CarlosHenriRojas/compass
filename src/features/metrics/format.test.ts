import { describe, expect, it } from "vitest";

import { calculateGoalProgress, formatMetricValue } from "./format";

describe("calculateGoalProgress", () => {
  it("calcula o avanço de uma métrica crescente a partir da linha de base", () => {
    expect(
      calculateGoalProgress({
        initial: 87,
        target: 150,
        current: 143,
        direction: "INCREASE",
      }),
    ).toBeCloseTo(88.89, 2);
  });

  it("calcula métricas decrescentes e limita o resultado a 100%", () => {
    expect(
      calculateGoalProgress({
        initial: 42,
        target: 20,
        current: 18,
        direction: "DECREASE",
      }),
    ).toBe(100);
  });

  it("não exibe progresso negativo", () => {
    expect(
      calculateGoalProgress({
        initial: 100,
        target: 200,
        current: 80,
        direction: "INCREASE",
      }),
    ).toBe(0);
  });

  it("retorna indisponível quando faltam valores ou a direção não permite cálculo", () => {
    expect(
      calculateGoalProgress({
        initial: null,
        target: 100,
        current: 50,
        direction: "INCREASE",
      }),
    ).toBeNull();
    expect(
      calculateGoalProgress({
        initial: 0,
        target: 100,
        current: 50,
        direction: "NEUTRAL",
      }),
    ).toBeNull();
  });

  it("rejeita metas incompatíveis com a direção escolhida", () => {
    expect(
      calculateGoalProgress({
        initial: 100,
        target: 80,
        current: 90,
        direction: "INCREASE",
      }),
    ).toBeNull();
    expect(
      calculateGoalProgress({
        initial: 100,
        target: 120,
        current: 110,
        direction: "DECREASE",
      }),
    ).toBeNull();
  });
});

describe("formatMetricValue", () => {
  it("formata moeda, percentual e números inteiros em pt-BR", () => {
    expect(
      formatMetricValue(1500, {
        key: "BRL",
        name: "Real",
        symbol: "R$",
        format: "currency",
      }),
    ).toContain("1.500,00");
    expect(
      formatMetricValue(12.5, {
        key: "PERCENTAGE",
        name: "Percentual",
        symbol: "%",
        format: "percentage",
      }),
    ).toBe("12,5%");
    expect(
      formatMetricValue(1234.8, {
        key: "LEADS",
        name: "Leads",
        symbol: "",
        format: "integer",
      }),
    ).toBe("1.235");
  });

  it("mostra um estado explícito quando não existe valor", () => {
    expect(formatMetricValue(null)).toBe("Não informado");
  });
});
