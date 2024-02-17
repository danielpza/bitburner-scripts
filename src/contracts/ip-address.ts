/*
Generate IP Addresses

Given the following string containing only digits, return an array with all possible valid IP address combinations that can be created from the string:

20024012134

Note that an octet cannot begin with a '0' unless the number itself is actually 0. For example, '192.168.010.1' is not a valid IP.

Examples:

25525511135 -> ["255.255.11.135", "255.255.111.35"]
1938718066 -> ["193.87.180.66"]
 */

function isValidRange(input: string): boolean {
  if (input.startsWith("0")) return false;
  const num = parseInt(input, 10);
  return num <= 255;
}

export function generateIpAddresses(input: string): string[] {
  const result = [];
  const len = input.length;
  for (let i = 1; i < len; i++) {
    for (let j = i + 1; j < len; j++) {
      for (let k = j + 1; k < len; k++) {
        const ranges = [input.slice(0, i), input.slice(i, j), input.slice(j, k), input.slice(k)];
        if (ranges.some((r) => !isValidRange(r))) continue;
        const ip = ranges.join(".");
        result.push(ip);
      }
    }
  }
  return result;
}
