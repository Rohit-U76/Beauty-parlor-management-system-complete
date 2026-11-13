package com.modernsalon.controller;

import com.modernsalon.model.SalonModels.SalonDatabaseState;
import com.modernsalon.service.SalonStorageService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.*;

import static com.modernsalon.service.SalonStorageService.*;

@RestController
@RequestMapping("/api/offers")
public class OfferController {

    private final SalonStorageService storage;

    public OfferController(SalonStorageService storage) {
        this.storage = storage;
    }

    @GetMapping
    public Map<String, Object> list() {
        SalonDatabaseState db = storage.readDb();
        return mapOf("success", true, "offers", db.offers);
    }

    @GetMapping("/clients-preview")
    public Map<String, Object> clientsPreview() {
        SalonDatabaseState db = storage.readDb();
        List<Map<String, Object>> clients = storage.getUniqueClientContacts(db);
        return mapOf("success", true, "count", clients.size(), "totalClients", clients.size(), "clients", clients);
    }

    @GetMapping("/broadcast-logs")
    public Map<String, Object> broadcastLogs() {
        SalonDatabaseState db = storage.readDb();
        return mapOf("success", true, "logs", db.broadcastLogs);
    }

    @PostMapping
    public ResponseEntity<Map<String, Object>> create(@RequestBody Map<String, Object> body) {
        String code = str(body.get("code")).toUpperCase().trim();
        String title = str(body.get("title")).trim();
        if (code.isEmpty() || title.isEmpty()) {
            return ResponseEntity.badRequest().body(mapOf("success", false, "message", "Offer code and title are required."));
        }

        SalonDatabaseState db = storage.readDb();
        Map<String, Object> offer = new LinkedHashMap<>();
        offer.put("id", strOr(body.get("id"), "off-" + System.currentTimeMillis()));
        offer.put("code", code);
        offer.put("title", title);
        offer.put("description", str(body.get("description")));
        offer.put("discountPercent", asInt(body.get("discountPercent")));
        offer.put("discountAmount", asInt(body.get("discountAmount")));
        offer.put("minBookingAmount", asInt(body.get("minBookingAmount")));
        offer.put("validTill", strOr(body.get("validTill"), strOr(body.get("expiryDate"), "2026-12-31")));
        offer.put("active", !Boolean.FALSE.equals(body.get("active")));

        db.offers.removeIf(o -> code.equalsIgnoreCase(str(o.get("code"))));
        db.offers.add(0, offer);

        Map<String, Object> broadcast = storage.dispatchWhatsAppOfferBroadcast(db, offer);
        storage.writeDb(db);

        return ResponseEntity.status(HttpStatus.CREATED).body(mapOf(
                "success", true,
                "offer", offer,
                "broadcast", broadcast,
                "message", "Offer " + code + " published & broadcasted to " + broadcast.get("totalRecipients") + " clients."
        ));
    }

    @GetMapping({"/{id}/broadcast-whatsapp", "/{id}/broadcast-preview"})
    public ResponseEntity<Map<String, Object>> previewBroadcast(@PathVariable String id) {
        SalonDatabaseState db = storage.readDb();
        Map<String, Object> offer = db.offers.stream()
                .filter(o -> id.equals(str(o.get("id"))) || id.equalsIgnoreCase(str(o.get("code"))))
                .findFirst().orElse(null);

        if (offer == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(mapOf("success", false, "message", "Offer not found in database."));
        }

        List<Map<String, Object>> recipients = storage.getUniqueClientContacts(db);
        List<Map<String, Object>> recipientResults = new ArrayList<>();
        for (Map<String, Object> r : recipients) {
            String msg = storage.buildOfferWhatsAppMessage(offer, str(r.get("name")), db.settings);
            String encoded = urlEncode(msg);
            String formattedPhone = str(r.get("formattedPhone"));
            Map<String, Object> item = new LinkedHashMap<>(r);
            item.put("whatsappUrl", "https://api.whatsapp.com/send?phone=" + formattedPhone + "&text=" + encoded);
            item.put("webWhatsappUrl", "https://web.whatsapp.com/send?phone=" + formattedPhone + "&text=" + encoded);
            item.put("status", "QUEUED");
            recipientResults.add(item);
        }

        Map<String, Object> broadcast = mapOf(
                "id", "preview-" + System.currentTimeMillis(),
                "offerId", offer.get("id"),
                "offerCode", offer.get("code"),
                "offerTitle", offer.get("title"),
                "discountPercent", offer.get("discountPercent"),
                "discountAmount", offer.get("discountAmount"),
                "dispatchedAt", Instant.now().toString(),
                "totalRecipients", recipientResults.size(),
                "messageText", storage.buildOfferWhatsAppMessage(offer, "Client Name", db.settings),
                "recipients", recipientResults
        );

        return ResponseEntity.ok(mapOf("success", true, "offer", offer, "broadcast", broadcast));
    }

    @PostMapping("/{id}/broadcast-whatsapp")
    public ResponseEntity<Map<String, Object>> rebroadcast(@PathVariable String id) {
        SalonDatabaseState db = storage.readDb();
        Map<String, Object> offer = db.offers.stream()
                .filter(o -> id.equals(str(o.get("id"))) || id.equalsIgnoreCase(str(o.get("code"))))
                .findFirst().orElse(null);

        if (offer == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(mapOf("success", false, "message", "Offer not found in database."));
        }

        Map<String, Object> broadcast = storage.dispatchWhatsAppOfferBroadcast(db, offer);
        storage.writeDb(db);

        return ResponseEntity.ok(mapOf("success", true, "offer", offer, "broadcast", broadcast,
                "message", "Offer " + str(offer.get("code")) + " broadcasted via WhatsApp to " + broadcast.get("totalRecipients") + " clients."));
    }

    @PatchMapping("/{id}/toggle")
    public ResponseEntity<Map<String, Object>> toggle(@PathVariable String id) {
        SalonDatabaseState db = storage.readDb();
        for (Map<String, Object> o : db.offers) {
            if (id.equals(str(o.get("id")))) {
                o.put("active", !Boolean.TRUE.equals(o.get("active")));
                storage.writeDb(db);
                return ResponseEntity.ok(mapOf("success", true, "offer", o));
            }
        }
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(mapOf("success", false, "message", "Offer not found"));
    }

    @DeleteMapping("/{id}")
    public Map<String, Object> delete(@PathVariable String id) {
        SalonDatabaseState db = storage.readDb();
        db.offers.removeIf(o -> id.equals(str(o.get("id"))));
        storage.writeDb(db);
        return mapOf("success", true, "message", "Offer deleted successfully");
    }
}
