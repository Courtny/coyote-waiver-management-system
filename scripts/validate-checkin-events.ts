import fs from 'fs';
import path from 'path';
import {
  CHECKIN_EVENTS_FILE,
  normalizeEventsArray,
  validateCheckinEvents,
} from '../lib/checkin-config';

const filePath = path.join(process.cwd(), CHECKIN_EVENTS_FILE);

function main(): void {
  let raw: string;
  try {
    raw = fs.readFileSync(filePath, 'utf8');
  } catch {
    console.error(`Could not read ${CHECKIN_EVENTS_FILE}`);
    process.exit(1);
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (e) {
    console.error(`${CHECKIN_EVENTS_FILE} is not valid JSON:`, e);
    process.exit(1);
  }

  const events = normalizeEventsArray(parsed);
  const errors = validateCheckinEvents(events);
  if (errors.length > 0) {
    console.error(`${CHECKIN_EVENTS_FILE} validation failed:`);
    for (const err of errors) console.error(`  - ${err}`);
    process.exit(1);
  }

  console.log(`OK: ${events.length} events in ${CHECKIN_EVENTS_FILE}`);
}

main();
