/*
Encryption I: Caesar Cipher

Caesar cipher is one of the simplest encryption technique. It is a type of substitution cipher in which each letter in the plaintext is replaced by a letter some fixed number of positions down the alphabet. For example, with a left shift of 3, D would be replaced by A, E would become B, and A would become X (because of rotation).

You are given an array with two elements:
  ["ARRAY SHIFT LINUX ENTER CACHE", 22]
The first element is the plaintext, the second element is the left shift value.

Return the ciphertext as uppercase string. Spaces remains the same.
*/

const A = "A".charCodeAt(0);
const Z = "Z".charCodeAt(0);
const LENGTH = Z - A + 1;

export function caesarCipherContract([text, shift]: [string, number]) {
  text = text.toUpperCase();
  shift = shift % LENGTH;
  return Array.from(text)
    .map((c) => {
      if (c === " ") return c;
      let newValue = c.charCodeAt(0) - shift;
      if (newValue < A) newValue += LENGTH;
      return String.fromCharCode(newValue);
    })
    .join("");
}
