import { loadSession, saveMessage } from './contextStore.js';
import { detectIntent } from './intentDetector.js';
import { resolveContext } from './contextResolver.js';
import { searchTours, getTourDetail, getTourReviews, getTourSchedule, calculateTourPrice } from './tourService.js';
import { getPolicies } from './policyService.js';
import { getBookingStatus } from './bookingService.js';
import { getPaymentStatus } from './paymentService.js';
import { getWebsiteHelp } from './websiteHelpService.js';
import { SYSTEM_PROMPT, buildPrompt } from './promptBuilder.js';
import { generateAnswer } from './aiService.js';
import { INTENTS } from './intents.js';

export async function chatController(req, res) {
  const { message, sessionId, phoneOrEmail } = req.body;
  const session = loadSession(sessionId);
  const intent = detectIntent(message, session.context);
  const resolved = await resolveContext(message, intent, session.context);

  const data = { tourData: null, reviewData: null, scheduleData: null, priceData: null, policyData: null, bookingData: null, paymentData: null, websiteHelpData: null };
  switch (intent) {
    case INTENTS.TOUR_SEARCH:
      data.tourData = await searchTours(message, {});
      break;
    case INTENTS.TOUR_DETAIL:
    case INTENTS.TOUR_FOLLOW_UP:
      data.tourData = resolved.tourId ? [await getTourDetail(resolved.tourId)] : [];
      break;
    case INTENTS.TOUR_REVIEW:
      data.tourData = resolved.tourId ? [await getTourDetail(resolved.tourId)] : [];
      data.reviewData = await getTourReviews(resolved.tourId);
      break;
    case INTENTS.TOUR_COMPARE:
      data.tourData = await Promise.all((resolved.compareTourIds || []).slice(0, 4).map(getTourDetail));
      break;
    case INTENTS.TOUR_SCHEDULE:
      data.scheduleData = await getTourSchedule(resolved.tourId, resolved.date);
      break;
    case INTENTS.PRICE_CALCULATION:
      data.priceData = await calculateTourPrice(resolved.tourId, resolved.peopleCount);
      break;
    case INTENTS.PAYMENT_POLICY:
    case INTENTS.CANCELLATION_POLICY:
      data.policyData = await getPolicies();
      break;
    case INTENTS.BOOKING_STATUS:
      data.bookingData = await getBookingStatus(resolved.orderCode, phoneOrEmail);
      data.paymentData = await getPaymentStatus(resolved.orderCode);
      break;
    case INTENTS.WEBSITE_HELP:
      data.websiteHelpData = await getWebsiteHelp(message);
      break;
    case INTENTS.TRAVEL_ADVICE:
    case INTENTS.OUT_OF_SCOPE:
      break;
  }

  const aiInput = { userMessage: message, chatHistory: session.history, conversationContext: session.context, intent, resolved, ...data };
  const reply = await generateAnswer(SYSTEM_PROMPT, aiInput, buildPrompt);

  saveMessage(session, 'user', message);
  saveMessage(session, 'assistant', reply);
  updateContext(session.context, intent, resolved, data);
  res.json({ sessionId: session.sessionId, intent, reply, tours: (data.tourData || []).filter(Boolean).slice(0, 4) });
}

function updateContext(context, intent, resolved, data) {
  context.lastIntent = intent;
  if (resolved.tourId) context.selectedTourId = resolved.tourId;
  if (resolved.date) context.selectedDate = resolved.date;
  if (resolved.peopleCount) context.peopleCount = resolved.peopleCount;
  const tours = (data.tourData || []).filter(Boolean);
  if (tours.length) {
    context.selectedTourId = tours[0].id;
    context.selectedTourName = tours[0].name;
    context.lastAssistantTourSuggestions = tours.map(t => t.id);
    context.mentionedTourIds = tours.map(t => t.id);
  }
  context.summary = `lastIntent=${intent}; selectedTour=${context.selectedTourName || context.selectedTourId || 'none'}`;
}
