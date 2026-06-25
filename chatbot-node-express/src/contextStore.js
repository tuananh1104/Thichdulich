const sessions = new Map();

export function loadSession(sessionId = crypto.randomUUID()) {
  if (!sessions.has(sessionId)) {
    sessions.set(sessionId, {
      sessionId,
      history: [],
      context: {
        selectedTourId: null,
        selectedTourName: null,
        selectedDate: null,
        peopleCount: null,
        lastIntent: null,
        mentionedTourIds: [],
        lastAssistantTourSuggestions: [],
        summary: '',
      },
    });
  }
  return sessions.get(sessionId);
}

export function saveMessage(session, role, content) {
  session.history.push({ role, content, at: new Date().toISOString() });
  if (session.history.length > 20) session.history = session.history.slice(-20);
}
