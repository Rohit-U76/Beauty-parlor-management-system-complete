package com.modernsalon.controller;

import com.modernsalon.model.SalonModels.SalonDatabaseState;
import com.modernsalon.service.SalonStorageService;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.Year;
import java.util.LinkedHashMap;
import java.util.Map;

import static com.modernsalon.service.SalonStorageService.*;

@RestController
@RequestMapping("/api/customers")
public class CustomerController {

    private final SalonStorageService storage;

    public CustomerController(SalonStorageService storage) {
        this.storage = storage;
    }

    @GetMapping
    public Map<String, Object> list() {
        SalonDatabaseState db = storage.readDb();
        return mapOf("success", true, "customers", db.customers);
    }

    @PostMapping
    public Map<String, Object> upsert(@RequestBody Map<String, Object> payload) {
        SalonDatabaseState db = storage.readDb();
        Map<String, Object> customer = new LinkedHashMap<>();
        String id = strOr(payload.get("id"), "cust-" + System.currentTimeMillis());
        String phone = str(payload.get("phone")).trim();

        customer.put("id", id);
        customer.put("name", strOr(payload.get("name"), "New Client").trim());
        customer.put("phone", phone);
        customer.put("email", str(payload.get("email")).trim().toLowerCase());
        customer.put("totalVisits", asInt(payload.get("totalVisits")));
        customer.put("totalSpent", asDouble(payload.get("totalSpent")));
        customer.put("lastVisit", strOr(payload.get("lastVisit"), LocalDate.now().toString()));
        customer.put("favoriteService", strOr(payload.get("favoriteService"), "General Styling"));
        customer.put("memberSince", strOr(payload.get("memberSince"), String.valueOf(Year.now().getValue())));
        customer.put("tier", strOr(payload.get("tier"), "New Client"));

        int idx = -1;
        for (int i = 0; i < db.customers.size(); i++) {
            Map<String, Object> c = db.customers.get(i);
            if (id.equals(str(c.get("id"))) || (!phone.isEmpty() && phone.equals(str(c.get("phone"))))) {
                idx = i;
                break;
            }
        }
        if (idx >= 0) {
            Map<String, Object> merged = new LinkedHashMap<>(db.customers.get(idx));
            merged.putAll(customer);
            db.customers.set(idx, merged);
        } else {
            db.customers.add(0, customer);
        }

        storage.writeDb(db);
        return mapOf("success", true, "customer", customer, "message", "Customer record synchronized in database");
    }

    @PutMapping("/{id}")
    public Map<String, Object> update(@PathVariable String id, @RequestBody Map<String, Object> updates) {
        SalonDatabaseState db = storage.readDb();
        Map<String, Object> updated = null;
        for (int i = 0; i < db.customers.size(); i++) {
            if (id.equals(str(db.customers.get(i).get("id")))) {
                Map<String, Object> merged = new LinkedHashMap<>(db.customers.get(i));
                merged.putAll(updates);
                db.customers.set(i, merged);
                updated = merged;
                break;
            }
        }
        storage.writeDb(db);
        return mapOf("success", true, "customer", updated, "message", "Customer updated successfully in database");
    }

    @DeleteMapping("/{id}")
    public Map<String, Object> delete(@PathVariable String id) {
        SalonDatabaseState db = storage.readDb();
        db.customers.removeIf(c -> id.equals(str(c.get("id"))));
        storage.writeDb(db);
        return mapOf("success", true, "message", "Customer deleted successfully from database");
    }
}
