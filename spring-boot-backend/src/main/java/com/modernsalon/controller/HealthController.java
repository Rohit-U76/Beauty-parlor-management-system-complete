package com.modernsalon.controller;

import com.modernsalon.service.SalonStorageService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.LinkedHashMap;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class HealthController {

    private final SalonStorageService storage;

    public HealthController(SalonStorageService storage) {
        this.storage = storage;
    }

    @GetMapping("/health")
    public Map<String, Object> health() {
        Map<String, Object> res = new LinkedHashMap<>();
        res.put("status", "ok");
        res.put("service", "Smart Salon Backend & Payment API (Java Spring Boot)");
        res.put("database", storage.getDatabaseStatus());
        return res;
    }

    @GetMapping("/db/status")
    public Map<String, Object> dbStatus() {
        return storage.getDatabaseStatus();
    }
}
