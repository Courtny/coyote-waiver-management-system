import type { EventAttendanceLine } from './checkin-attendance';
import { resolveWaiverForTicketCustomer, type CheckinWaiverResult } from './checkin-person';
import { normalizeEmail } from './waiver-checkin-lookup';
import { computeWaiverIndicator } from './ticket-waiver-indicator';

function resolveInputForLine(line: EventAttendanceLine): { name?: string; email?: string } {
  const em = line.customerEmail?.trim();
  if (em && em !== '—') {
    return { email: em };
  }
  const nm = line.customerName?.trim();
  if (nm && nm !== '—') {
    return { name: nm };
  }
  return {};
}

export function customerDedupeKey(line: EventAttendanceLine): string {
  const em = line.customerEmail?.trim();
  if (em && em !== '—') {
    return `e:${normalizeEmail(em)}`;
  }
  const nm = line.customerName?.trim();
  if (nm && nm !== '—') {
    return `n:${nm.toLowerCase()}`;
  }
  return `u:${line.orderId}:${line.sku}`;
}

export async function enrichAttendanceLinesWithWaiverIndicators(
  lines: EventAttendanceLine[],
  currentYear: number
): Promise<EventAttendanceLine[]> {
  const uniqueKeys = [...new Set(lines.map(customerDedupeKey))];
  const waiverByKey = new Map<string, CheckinWaiverResult>();

  await Promise.all(
    uniqueKeys.map(async (key) => {
      const line = lines.find((l) => customerDedupeKey(l) === key)!;
      const input = resolveInputForLine(line);
      const r = await resolveWaiverForTicketCustomer(input, currentYear);
      waiverByKey.set(key, r);
    })
  );

  return lines.map((line) => {
    const r = waiverByKey.get(customerDedupeKey(line))!;
    const partySize = line.partySize ?? 1;
    return {
      ...line,
      waiverIndicator: computeWaiverIndicator(r, {
        quantity: line.quantity,
        partySize,
      }),
    };
  });
}
