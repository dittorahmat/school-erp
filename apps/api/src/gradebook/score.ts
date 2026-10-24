export interface ScoreComponent {
  weight: number;
  score: number | null | undefined;
}

export function calculateFinalScore(components: ScoreComponent[]): number {
  const scored = components.filter(
    (component) => typeof component.score === "number" && component.weight > 0
  );
  const totalWeight = scored.reduce((total, component) => total + component.weight, 0);
  if (totalWeight === 0) return 0;

  const weighted = scored.reduce(
    (total, component) => total + (component.score as number) * component.weight,
    0
  );
  return Number((weighted / totalWeight).toFixed(1));
}

export function predicateFor(score: number): "A" | "B" | "C" | "D" {
  if (score >= 85) return "A";
  if (score >= 75) return "B";
  if (score >= 60) return "C";
  return "D";
}
