/** return last value that satisfies condition */
export function binarySearch(min: number, max: number, condition: (value: number) => boolean) {
  if (condition(max)) return max;
  while (min < max) {
    const mid = Math.floor((min + max) / 2);
    if (condition(mid)) {
      min = mid + 1;
    } else {
      max = mid;
    }
  }
  return min - 1;
}
