/*
Find Largest Prime Factor
A prime factor is a factor that is a prime number. What is the largest prime factor of 592820472?
*/

// stolen from https://stackoverflow.com/questions/23287/algorithm-to-find-largest-prime-factor-of-a-number
export function largestPrimeFactor(input: number) {
  let i = 2;
  while (input > 1) {
    if (input % i === 0) input /= i;
    else if (i > Math.sqrt(input)) i = input;
    else i += 1;
  }
  return i;
}
