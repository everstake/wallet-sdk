export function containsCaseInsensitive(arr: string[], entry: string): boolean {
  return arr.some((e) => e.toLowerCase() === entry.toLowerCase());
}
