package com.example.thichdulich.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.Instant;
import java.util.ArrayDeque;
import java.util.Deque;
import java.util.Iterator;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class ContactRateLimitService {
    private final Map<String, Deque<Instant>> attemptsByKey = new ConcurrentHashMap<>();

    @Value("${app.contact.rate-limit.max-requests:5}")
    private int maxRequests;

    @Value("${app.contact.rate-limit.window-minutes:10}")
    private int windowMinutes;

    public boolean allow(String key) {
        String rateLimitKey = key == null || key.isBlank() ? "unknown" : key;
        Instant now = Instant.now();
        Instant cutoff = now.minus(Duration.ofMinutes(Math.max(1, windowMinutes)));
        Deque<Instant> attempts = attemptsByKey.computeIfAbsent(rateLimitKey, ignored -> new ArrayDeque<>());

        synchronized (attempts) {
            while (!attempts.isEmpty() && attempts.peekFirst().isBefore(cutoff)) {
                attempts.removeFirst();
            }
            if (attempts.size() >= Math.max(1, maxRequests)) {
                cleanup(cutoff);
                return false;
            }
            attempts.addLast(now);
            cleanup(cutoff);
            return true;
        }
    }

    private void cleanup(Instant cutoff) {
        Iterator<Map.Entry<String, Deque<Instant>>> iterator = attemptsByKey.entrySet().iterator();
        while (iterator.hasNext()) {
            Map.Entry<String, Deque<Instant>> entry = iterator.next();
            Deque<Instant> attempts = entry.getValue();
            synchronized (attempts) {
                while (!attempts.isEmpty() && attempts.peekFirst().isBefore(cutoff)) {
                    attempts.removeFirst();
                }
                if (attempts.isEmpty()) {
                    iterator.remove();
                }
            }
        }
    }
}
