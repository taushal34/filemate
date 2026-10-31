import { DiffResult } from '../types';

/**
 * Computes line-by-line difference using Longest Common Subsequence
 */
export function computeLineDiff(oldText: string, newText: string): DiffResult[] {
  const oldLines = oldText === '' ? [] : oldText.split('\n');
  const newLines = newText === '' ? [] : newText.split('\n');

  const m = oldLines.length;
  const n = newLines.length;

  // Initialize LCS table
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

  for (let i = 0; i < m; i++) {
    for (let j = 0; j < n; j++) {
      if (oldLines[i] === newLines[j]) {
        dp[i + 1][j + 1] = dp[i][j] + 1;
      } else {
        dp[i + 1][j + 1] = Math.max(dp[i + 1][j], dp[i][j + 1]);
      }
    }
  }

  // Backtrack to form diff
  let i = m;
  let j = n;
  const results: DiffResult[] = [];

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && oldLines[i - 1] === newLines[j - 1]) {
      results.unshift({
        type: 'unchanged',
        value: oldLines[i - 1],
        oldLineNumber: i,
        newLineNumber: j,
      });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      results.unshift({
        type: 'added',
        value: newLines[j - 1],
        newLineNumber: j,
      });
      j--;
    } else if (i > 0 && (j === 0 || dp[i][j - 1] < dp[i - 1][j])) {
      results.unshift({
        type: 'removed',
        value: oldLines[i - 1],
        oldLineNumber: i,
      });
      i--;
    }
  }

  return results;
}
