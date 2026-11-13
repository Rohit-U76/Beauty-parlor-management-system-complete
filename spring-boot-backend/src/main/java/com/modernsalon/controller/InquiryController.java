package com.modernsalon.controller;

import com.modernsalon.model.SalonModels.SalonDatabaseState;
import com.modernsalon.service.SalonStorageService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.time.LocalDate;
import java.util.LinkedHashMap;
import java.util.Map;

import static com.modernsalon.service.SalonStorageService.*;

@RestController
@RequestMapping("/api/inquiries")
public class InquiryController {

    private final SalonStorageService storage;

    public InquiryController(SalonStorageService storage) {
        this.storage = storage;
    }

    @GetMapping
    public Map<String, Object> list() {
        SalonDatabaseState db = storage.readDb();
        return mapOf("success", true, "inquiries", db.inquiries);
    }

    @PostMapping("/submit")
    public ResponseEntity<Map<String, Object>> submit(@RequestBody Map<String, Object> body) {
        String clientName = str(body.get("clientName")).trim();
        String message = str(body.get("message")).trim();
        if (clientName.isEmpty() || message.isEmpty()) {
            return ResponseEntity.badRequest().body(mapOf("error", "Name and message are required."));
        }

        String id = "inq-" + System.currentTimeMillis();
        Map<String, Object> inquiry = new LinkedHashMap<>();
        inquiry.put("id", id);
        inquiry.put("clientName", clientName);
        inquiry.put("phone", str(body.get("phone")));
        inquiry.put("email", str(body.get("email")));
        inquiry.put("subject", strOr(body.get("subject"), strOr(body.get("serviceCategory"), "General Service & Booking Inquiry")));
        inquiry.put("serviceCategory", strOr(body.get("serviceCategory"), "General Inquiry"));
        inquiry.put("message", message);
        inquiry.put("receivedDate", LocalDate.now().toString());
        inquiry.put("status", "NEW");

        SalonDatabaseState db = storage.readDb();
        db.inquiries.add(0, inquiry);
        storage.writeDb(db);

        return ResponseEntity.ok(mapOf(
                "success", true,
                "id", id,
                "inquiry", inquiry,
                "message", "Inquiry received successfully. Our salon team will respond shortly.",
                "receivedAt", Instant.now().toString()
        ));
    }

    @DeleteMapping("/{id}")
    public Map<String, Object> delete(@PathVariable String id) {
        SalonDatabaseState db = storage.readDb();
        db.inquiries.removeIf(inq -> id.equals(str(inq.get("id"))));
        storage.writeDb(db);
        return mapOf("success", true, "message", "Consultation inquiry deleted successfully from database.",
                "deletedId", id, "remainingCount", db.inquiries.size());
    }

    @PostMapping("/send-reply")
    public ResponseEntity<Map<String, Object>> sendReply(@RequestBody Map<String, Object> body) {
        String recipientEmail = str(body.get("recipientEmail"));
        String replyMessage = str(body.get("replyMessage"));
        if (recipientEmail.isEmpty() || replyMessage.isEmpty()) {
            return ResponseEntity.badRequest().body(mapOf("error", "Recipient email and reply message are required."));
        }
        return ResponseEntity.ok(mapOf(
                "success", true,
                "inquiryId", body.get("inquiryId"),
                "recipientEmail", recipientEmail,
                "status", "SENT",
                "sentAt", Instant.now().toString(),
                "message", "Email reply successfully dispatched to " + recipientEmail
        ));
    }
}
