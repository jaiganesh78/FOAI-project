export function sanitizeString(input: string): string {
  return input.trim().replace(/[<>]/g, '');
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
