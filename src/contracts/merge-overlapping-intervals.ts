/*
Merge Overlapping Intervals

Given the following array of arrays of numbers representing a list of intervals, merge all overlapping intervals.

[[15,20],[25,31],[20,27],[22,32],[12,18],[4,12],[21,23],[5,14],[14,15],[16,24],[4,5],[6,11],[24,33],[20,22],[20,23],[5,7],[12,16],[17,25]]

Example:

[[1, 3], [8, 10], [2, 6], [10, 16]]

would merge into [[1, 6], [8, 16]].

The intervals must be returned in ASCENDING order. You can assume that in an interval, the first number will always be smaller than the second.
 */

export function mergeOverlappingIntervals(input: [number, number][]) {
  let result = [input[0]];
  for (let i = 1; i < input.length; i++) {
    let [start, end] = input[i];
    for (let j = 0; j < result.length; j++) {
      const [jstart, jend] = result[j];
      if (start <= jend && end >= jstart) {
        start = Math.min(start, jstart);
        end = Math.max(end, jend);
        result.splice(j, 1);
        j--;
      }
    }
    result.push([start, end]);
  }
  return result.sort((a, b) => a[0] - b[0]);
}
