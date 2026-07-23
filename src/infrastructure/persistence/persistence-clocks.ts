import { randomUUID } from "node:crypto";

import type { ClockPort, IdGeneratorPort } from "@/kernel/ports/kernel-ports";

export class SystemClock implements ClockPort {
  now(): string {
    return new Date().toISOString();
  }
}

export class UuidGenerator implements IdGeneratorPort {
  nextId(): string {
    return randomUUID();
  }
}
