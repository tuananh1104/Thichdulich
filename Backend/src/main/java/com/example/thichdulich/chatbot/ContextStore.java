package com.example.thichdulich.chatbot;

import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class ContextStore {
    private final Map<String, ConversationContext> contexts = new ConcurrentHashMap<>();
    private final Map<String, List<ChatHistoryMessage>> histories = new ConcurrentHashMap<>();

    public String normalizeSessionId(String sessionId) {
        return sessionId == null || sessionId.isBlank() ? UUID.randomUUID().toString() : sessionId.trim();
    }

    public ConversationContext loadContext(String sessionId) {
        return contexts.computeIfAbsent(sessionId, ignored -> new ConversationContext());
    }

    public List<ChatHistoryMessage> loadHistory(String sessionId) {
        return histories.computeIfAbsent(sessionId, ignored -> new ArrayList<>());
    }

    public void saveMessage(String sessionId, String role, String content) {
        List<ChatHistoryMessage> history = loadHistory(sessionId);
        history.add(new ChatHistoryMessage(role, content, LocalDateTime.now()));
        if (history.size() > 20) {
            history.subList(0, history.size() - 20).clear();
        }
    }

    public void saveContext(String sessionId, ConversationContext context) {
        contexts.put(sessionId, context);
    }
}
