import { normalize } from './intentDetector.js';
import { searchTours } from './tourService.js';

export async function resolveContext(message, intent, context) {
  const q = normalize(message);
  const tours = await searchTours(q, {});
  const mentionedTourIds = tours
    .filter(t => q.includes(normalize(t.name)) || q.includes(normalize(t.location)))
    .map(t => t.id);
  const peopleMatch = q.match(/(\d{1,2})\s*(nguoi|khach)/);
  const orderMatch = message.toUpperCase().match(/\b[A-Z0-9]{5,}\b/);
  const date = q.includes('ngay mai') ? tomorrow() : context.selectedDate;
  const ambiguous = /(tour nay|tour do|cai nay|cai do|lich do|gia do|no|ben nay)/.test(q);

  return {
    tourId: mentionedTourIds[0] || (ambiguous ? context.selectedTourId || context.lastAssistantTourSuggestions[0] : context.selectedTourId),
    compareTourIds: mentionedTourIds.length > 1 ? mentionedTourIds : context.lastAssistantTourSuggestions,
    date,
    peopleCount: peopleMatch ? Number(peopleMatch[1]) : context.peopleCount,
    orderCode: orderMatch?.[0] || null,
    ambiguous,
  };
}

function tomorrow() {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  return date.toISOString().slice(0, 10);
}
