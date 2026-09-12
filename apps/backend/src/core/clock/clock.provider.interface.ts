export interface IClockProvider {
  now(): Date;
  isoString(): string;
  timestampMs(): number;
}
