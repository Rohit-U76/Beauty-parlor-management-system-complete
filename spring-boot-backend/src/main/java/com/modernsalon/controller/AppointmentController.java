package com.modernsalon.controller;

import com.modernsalon.model.SalonModels.SalonDatabaseState;
import com.modernsalon.service.SalonStorageService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.Instant;
import java.time.Year;
import java.util.*;

import static com.modernsalon.service.SalonStorageService.*;

@RestController
@RequestMapping("/api/appointments")
public class AppointmentController {

    private final SalonStorageService storage;

    @Value("${salon.uploads.dir:../public/uploads}")
    private String uploadsDir;

    public AppointmentController(SalonStorageService storage) {
        this.storage = storage;
    }

    @GetMapping
    public Map<String, Object> list() {
        SalonDatabaseState db = storage.readDb();
        return mapOf("success", true, "appointments", db.appointments);
    }

    @PostMapping
    public Map<String, Object> create(@RequestBody Map<String, Object> payload) {
        SalonDatabaseState db = storage.readDb();
        String bookingRef = strOr(payload.get("bookingRef"),
                "SS-" + Year.now().getValue() + "-" + (100000 + new Random().nextInt(900000)));
        String ownerPhone = "8104026257";
        String cleanClientPhone = str(payload.get("clientPhone")).replaceAll("[^0-9]", "");
        String formattedClientPhone = cleanClientPhone.length() == 10 ? "91" + cleanClientPhone : cleanClientPhone;

        String tsStr = String.valueOf(System.currentTimeMillis());
        String utr = strOr(payload.get("upiTransactionId"),
                strOr(payload.get("razorpayPaymentId"), "UTR-" + tsStr.substring(Math.max(0, tsStr.length() - 8))));
        String scannerUsed = strOr(payload.get("scannerUsed"), "MODERN JENTS PARLOUR (HDFC Bank)");

        String advVal = strOr(payload.get("advancePaid"), str(payload.get("advanceAmount")));
        String waText = "✨ *NEW APPOINTMENT CONFIRMED* ✨\n*Modern Unisex Salon, Mohol*\n"
                + "📋 *Booking Ref:* " + bookingRef + "\n"
                + "👤 *Client Name:* " + str(payload.get("clientName")) + "\n"
                + "📱 *Client Mobile:* " + str(payload.get("clientPhone")) + "\n"
                + "💇‍♀️ *Service:* " + str(payload.get("serviceName")) + "\n"
                + "📅 *Date & Slot:* " + str(payload.get("date")) + " at " + str(payload.get("timeSlot")) + "\n"
                + "💰 *Total Bill:* ₹" + str(payload.get("totalAmount")) + "\n"
                + "✅ *Advance Deposit Paid:* ₹" + advVal + "\n"
                + "🔢 *UPI Ref / UTR No:* " + utr;

        String encoded = urlEncode(waText);
        String ownerWhatsappUrl = "https://api.whatsapp.com/send?phone=91" + ownerPhone + "&text=" + encoded;
        String clientWhatsappUrl = !formattedClientPhone.isEmpty()
                ? "https://api.whatsapp.com/send?phone=" + formattedClientPhone + "&text=" + encoded
                : "https://api.whatsapp.com/send?text=" + encoded;

        Map<String, Object> apt = new LinkedHashMap<>(payload);
        apt.put("id", strOr(payload.get("id"), "apt-" + System.currentTimeMillis()));
        apt.put("bookingRef", bookingRef);
        apt.put("upiTransactionId", utr);
        apt.put("scannerUsed", scannerUsed);
        apt.put("advancePaid", asDouble(advVal));
        apt.put("paymentStatus", strOr(payload.get("paymentStatus"), "PAID"));
        apt.put("bookingStatus", strOr(payload.get("bookingStatus"), "CONFIRMED"));
        apt.put("status", strOr(payload.get("status"), strOr(payload.get("bookingStatus"), "CONFIRMED")));
        apt.put("createdAt", Instant.now().toString());
        apt.put("isNew", true);
        apt.put("whatsappUrl", clientWhatsappUrl);
        apt.put("ownerWhatsappUrl", ownerWhatsappUrl);

        String aptId = str(apt.get("id"));
        db.appointments.removeIf(a -> aptId.equals(str(a.get("id"))));
        db.appointments.add(0, apt);

        Map<String, Object> notif = mapOf(
                "id", "notif-" + System.currentTimeMillis(),
                "title", "New Online Reservation & 10% Deposit",
                "message", str(apt.get("clientName")) + " booked " + str(apt.get("serviceName")) + " for " + str(apt.get("date")) + " at " + str(apt.get("timeSlot")) + ".",
                "type", "booking",
                "timestamp", "Just now",
                "read", false,
                "bookingRef", bookingRef,
                "appointmentId", aptId
        );
        db.notifications.add(0, notif);
        storage.writeDb(db);

        return mapOf("success", true, "appointment", apt, "notification", notif,
                "ownerWhatsappUrl", ownerWhatsappUrl,
                "message", "Appointment booked successfully and synchronized in real time.");
    }

    @PutMapping("/{id}")
    public Map<String, Object> update(@PathVariable String id, @RequestBody Map<String, Object> updates) {
        SalonDatabaseState db = storage.readDb();
        Map<String, Object> updated = null;
        for (int i = 0; i < db.appointments.size(); i++) {
            if (id.equals(str(db.appointments.get(i).get("id")))) {
                Map<String, Object> merged = new LinkedHashMap<>(db.appointments.get(i));
                merged.putAll(updates);
                merged.put("isNew", false);
                db.appointments.set(i, merged);
                updated = merged;
                break;
            }
        }
        storage.writeDb(db);
        return mapOf("success", true, "message", "Appointment updated successfully", "appointment", updated);
    }

    @DeleteMapping("/{id}")
    public Map<String, Object> delete(@PathVariable String id) {
        SalonDatabaseState db = storage.readDb();
        db.appointments.removeIf(a -> id.equals(str(a.get("id"))));
        storage.writeDb(db);
        return mapOf("success", true, "message", "Appointment deleted successfully");
    }

    @PostMapping("/{id}/verify-manually")
    public ResponseEntity<Map<String, Object>> verifyManually(@PathVariable String id) {
        SalonDatabaseState db = storage.readDb();
        Map<String, Object> apt = db.appointments.stream()
                .filter(a -> id.equals(str(a.get("id"))) || id.equals(str(a.get("bookingRef"))))
                .findFirst().orElse(null);

        if (apt == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(mapOf("success", false, "error", "Appointment not found"));
        }

        apt.put("paymentStatus", "PAID");
        apt.put("bookingStatus", "CONFIRMED");
        apt.put("status", "CONFIRMED");
        apt.put("bankVerifiedAt", Instant.now().toString());
        apt.put("bankVerifiedSource", "ADMIN_MANUAL");

        db.notifications.add(0, mapOf(
                "id", "notif-" + System.currentTimeMillis(),
                "title", "Appointment Manually Verified",
                "message", "Admin manually verified deposit for " + str(apt.get("clientName")) + " (" + str(apt.get("bookingRef")) + ").",
                "type", "booking",
                "timestamp", "Just now",
                "read", false,
                "bookingRef", apt.get("bookingRef"),
                "appointmentId", apt.get("id")
        ));
        storage.writeDb(db);
        return ResponseEntity.ok(mapOf("success", true, "message", "Deposit verified and appointment confirmed.", "appointment", apt));
    }

    @PostMapping("/{id}/reject-fake")
    public ResponseEntity<Map<String, Object>> rejectFake(@PathVariable String id, @RequestBody(required = false) Map<String, Object> body) {
        SalonDatabaseState db = storage.readDb();
        Map<String, Object> apt = db.appointments.stream()
                .filter(a -> id.equals(str(a.get("id"))) || id.equals(str(a.get("bookingRef"))))
                .findFirst().orElse(null);

        if (apt == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(mapOf("success", false, "error", "Appointment not found"));
        }

        String reason = body != null ? strOr(body.get("reason"), "Fake or unverified UTR provided.") : "Fake or unverified UTR provided.";
        apt.put("bookingStatus", "CANCELLED");
        apt.put("status", "CANCELLED");
        apt.put("paymentStatus", "REFUNDED");
        apt.put("notes", (str(apt.get("notes")) + " [REJECTED: " + reason + "]").trim());

        db.notifications.add(0, mapOf(
                "id", "notif-" + System.currentTimeMillis(),
                "title", "⚠️ Fake Deposit Rejected & Slot Released",
                "message", "Appointment " + str(apt.get("bookingRef")) + " cancelled due to invalid/fake UTR.",
                "type", "alert",
                "timestamp", "Just now",
                "read", false,
                "bookingRef", apt.get("bookingRef"),
                "appointmentId", apt.get("id")
        ));
        storage.writeDb(db);
        return ResponseEntity.ok(mapOf("success", true, "message", "Appointment rejected and slot released back for booking.", "appointment", apt));
    }

    @PostMapping("/upload-screenshot")
    public ResponseEntity<Map<String, Object>> uploadScreenshot(@RequestBody Map<String, Object> body) {
        try {
            String imageBase64 = str(body.get("imageBase64"));
            if (imageBase64.isEmpty()) {
                return ResponseEntity.badRequest().body(mapOf("success", false, "message", "No screenshot image provided"));
            }
            String ext = "jpg";
            String base64Payload = imageBase64;
            if (imageBase64.startsWith("data:") && imageBase64.contains(",")) {
                String header = imageBase64.substring(0, imageBase64.indexOf(","));
                if (header.contains("png")) ext = "png";
                else if (header.contains("webp")) ext = "webp";
                base64Payload = imageBase64.substring(imageBase64.indexOf(",") + 1);
            }
            byte[] bytes = Base64.getDecoder().decode(base64Payload);
            String safeRef = strOr(body.get("bookingRef"), "booking").replaceAll("[^a-zA-Z0-9_-]", "_");
            String filename = "screenshot_" + safeRef + "_" + System.currentTimeMillis() + "." + ext;
            Path dir = Paths.get(uploadsDir, "screenshots").toAbsolutePath().normalize();
            Files.createDirectories(dir);
            Files.write(dir.resolve(filename), bytes);
            return ResponseEntity.ok(mapOf("success", true, "screenshotUrl", "/uploads/screenshots/" + filename, "filename", filename));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(mapOf("success", false, "message", "Failed to save screenshot: " + e.getMessage()));
        }
    }
}
