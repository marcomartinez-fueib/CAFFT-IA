import { QPVIIAnswers, QPVIIScores } from '../types';
import {
  QPVII_MALESTAR_GENERAL_ITEMS,
  QPVII_SUB_PREPARATIUS_ITEMS,
  QPVII_SUB_VICARI_ITEMS,
  QPVII_SUB_VOL_ITEMS,
  ALL_QPVII_ITEMS_INDICES
} from '../constants';

/**
 * Calculates QPV-II scores based on the latest validated formulas.
 * @param answers The 0st-indexed answers to the 31 questions (0 to 30).
 * @returns An object containing subscale and total scores.
 */
export const calculateQPVIIScores = (answers: QPVIIAnswers): QPVIIScores => {
  const getSum = (itemIndices: number[]): number =>
    itemIndices.reduce((sum, index) => sum + (answers[index] || 0), 0);

  return {
    malestarGeneral: getSum(QPVII_MALESTAR_GENERAL_ITEMS),
    subPreparatius: getSum(QPVII_SUB_PREPARATIUS_ITEMS),
    subVicari: getSum(QPVII_SUB_VICARI_ITEMS),
    subVol: getSum(QPVII_SUB_VOL_ITEMS),
    total: getSum(ALL_QPVII_ITEMS_INDICES),
  };
};
