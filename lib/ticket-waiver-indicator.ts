import type { CheckinWaiverResult } from './checkin-person';
import type { WaiverIndicatorDto } from './checkin-attendance';

const PARTY_TOOLTIP =
  'Please verify that all members of the party are in attendance and verify their name and waiver are on file.';

function waiverSupplementText(result: CheckinWaiverResult): string | null {
  if (result.ambiguous) {
    return 'Multiple possible waivers — verify in person.';
  }
  if (result.status === 'not_found') {
    return 'No matching waiver on file for this customer.';
  }
  if (result.status === 'expired') {
    return 'Waiver on file but not current year — verify renewal.';
  }
  if (result.status === 'active' && result.confidence === 'name_fuzzy') {
    return 'Soft match: waiver matched by name only — verify ID in person.';
  }
  return null;
}

/**
 * Map check-in waiver resolution + line quantities to a tri-color indicator and tooltip.
 * Party / multi-seat lines are always yellow with PARTY_TOOLTIP plus optional waiver context.
 */
export function computeWaiverIndicator(
  result: CheckinWaiverResult,
  opts: { quantity: number; partySize: number }
): WaiverIndicatorDto {
  const multiPerson = opts.quantity > 1 || opts.partySize > 1;
  if (multiPerson) {
    const extra = waiverSupplementText(result);
    const tooltip = extra ? `${PARTY_TOOLTIP} ${extra}` : PARTY_TOOLTIP;
    return { level: 'yellow', tooltip };
  }

  if (result.ambiguous) {
    return {
      level: 'yellow',
      tooltip: 'Multiple possible waivers — verify in person.',
    };
  }

  if (result.status === 'not_found') {
    return {
      level: 'red',
      tooltip: 'No matching waiver on file for this customer.',
    };
  }

  if (result.status === 'expired') {
    return {
      level: 'yellow',
      tooltip: 'Waiver on file but not current year — verify renewal.',
    };
  }

  if (result.status === 'active') {
    if (result.confidence === 'email_match' || result.confidence === 'phone_match') {
      return {
        level: 'green',
        tooltip: 'Confirmed: waiver on file (matched via email or phone).',
      };
    }
    if (result.confidence === 'name_fuzzy') {
      return {
        level: 'yellow',
        tooltip: 'Soft match: waiver matched by name only — verify ID in person.',
      };
    }
  }

  return {
    level: 'red',
    tooltip: 'No matching waiver on file for this customer.',
  };
}
