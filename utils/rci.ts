/**
 * Reliable Change Index (RCI) for the QPV-II total score.
 *
 * Jacobson, N. S., & Truax, P. (1991). Clinical significance: A statistical
 * approach to defining meaningful change in psychotherapy research.
 * Journal of Consulting and Clinical Psychology, 59(1), 12–19.
 *
 *   RCI = (post − pre) / Sdiff
 *
 * Sdiff = 17.6, taken from the QPV-II psychometric studies (SD ≈ 50).
 * A change is reliable when |RCI| > 1.96 (p < .05). Because a lower QPV-II
 * score means less fear, a reliable improvement gives a NEGATIVE RCI.
 */
const QPVII_SDIFF = 17.6;
const RCI_THRESHOLD = 1.96;

export type RciDirection = 'improvement' | 'deterioration' | 'none';

export interface RciResult {
  value: number;
  reliable: boolean;
  direction: RciDirection;
}

export function computeRci(preTotal: number, postTotal: number): RciResult {
  const value = (postTotal - preTotal) / QPVII_SDIFF;
  const reliable = Math.abs(value) > RCI_THRESHOLD;
  const direction: RciDirection = !reliable ? 'none' : value < 0 ? 'improvement' : 'deterioration';
  return { value, reliable, direction };
}
