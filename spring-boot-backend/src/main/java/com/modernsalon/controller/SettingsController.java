package com.modernsalon.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.modernsalon.model.SalonModels.SalonDatabaseState;
import com.modernsalon.model.SalonModels.SalonSettings;
import com.modernsalon.service.SalonStorageService;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import static com.modernsalon.service.SalonStorageService.mapOf;
import static com.modernsalon.service.SalonStorageService.str;

@RestController
@RequestMapping("/api")
public class SettingsController {

    private final SalonStorageService storage;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public SettingsController(SalonStorageService storage) {
        this.storage = storage;
    }

    @GetMapping("/settings")
    public Map<String, Object> getSettings() {
        SalonDatabaseState db = storage.readDb();
        return mapOf("success", true, "settings", db.settings);
    }

    @PutMapping("/settings")
    public Map<String, Object> updateSettings(@RequestBody Map<String, Object> updates) {
        SalonDatabaseState db = storage.readDb();
        @SuppressWarnings("unchecked")
        Map<String, Object> currentMap = objectMapper.convertValue(db.settings, Map.class);
        String oldPassword = db.settings != null ? db.settings.adminPassword : null;

        currentMap.putAll(updates);

        // Normalize up to 4 admin emails if supplied
        if (updates.containsKey("adminEmails") && updates.get("adminEmails") instanceof List<?> rawList) {
            List<String> normalized = new ArrayList<>();
            for (int i = 0; i < Math.min(4, rawList.size()); i++) {
                normalized.add(str(rawList.get(i)).trim().toLowerCase());
            }
            currentMap.put("adminEmails", normalized);
        }

        if (updates.get("adminPassword") != null && !str(updates.get("adminPassword")).equals(oldPassword)) {
            currentMap.put("adminPasswordUpdatedAt", System.currentTimeMillis());
        }

        db.settings = objectMapper.convertValue(currentMap, SalonSettings.class);
        storage.writeDb(db);
        return mapOf("success", true, "settings", db.settings, "message", "Settings updated successfully");
    }

    @PostMapping("/admin/clear-past-data")
    public Map<String, Object> clearPastData() {
        SalonDatabaseState db = storage.readDb();
        db.appointments.clear();
        db.customers.clear();
        db.inquiries.clear();
        db.notifications.clear();
        db.broadcastLogs.clear();
        db.verifiedDeposits.clear();
        db.users.removeIf(u -> !"ADMIN".equals(str(u.get("role"))));
        storage.writeDb(db);
        return mapOf("success", true, "message", "All past appointments, users, customer CRM, and analytics records cleared.");
    }
}
