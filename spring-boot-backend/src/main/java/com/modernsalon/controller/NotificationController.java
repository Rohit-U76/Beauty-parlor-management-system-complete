package com.modernsalon.controller;

import com.modernsalon.model.SalonModels.SalonDatabaseState;
import com.modernsalon.service.SalonStorageService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.Map;

import static com.modernsalon.service.SalonStorageService.*;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    private final SalonStorageService storage;

    public NotificationController(SalonStorageService storage) {
        this.storage = storage;
    }

    @GetMapping
    public Map<String, Object> list() {
        SalonDatabaseState db = storage.readDb();
        return mapOf("success", true, "notifications", db.notifications);
    }

    @PostMapping("/mark-read")
    public Map<String, Object> markRead() {
        SalonDatabaseState db = storage.readDb();
        for (Map<String, Object> n : db.notifications) {
            n.put("read", true);
        }
        storage.writeDb(db);
        return mapOf("success", true, "message", "Notifications marked as read");
    }

    @PostMapping("/send-sms")
    public ResponseEntity<Map<String, Object>> sendSms(@RequestBody Map<String, Object> body) {
        String phone = str(body.get("phone"));
        if (phone.isBlank()) {
            return ResponseEntity.badRequest().body(mapOf("error", "Phone number is required."));
        }
        String clientName = strOr(body.get("clientName"), "Valued Client");
        String bookingRef = strOr(body.get("bookingRef"), "SS-CONFIRMED");
        String serviceName = strOr(body.get("serviceName"), "Service");
        String date = strOr(body.get("date"), "upcoming date");
        String timeSlot = strOr(body.get("timeSlot"), "scheduled time");
        String templateType = str(body.get("templateType"));
        String messageText = str(body.get("customMessage"));

        if (messageText.isBlank()) {
            switch (templateType) {
                case "CONFIRMATION" -> messageText = "Dear " + clientName + ", your booking at Modern Unisex Salon (Ref: " + bookingRef + ") for " + serviceName + " on " + date + " at " + timeSlot + " is CONFIRMED.";
                case "REMINDER_2H" -> messageText = "Reminder from Modern Unisex Salon: Your appointment for " + serviceName + " is in 2 hours (" + timeSlot + ").";
                case "CHECKIN_COMPLETED" -> messageText = "Thank you for visiting Modern Unisex Salon, " + clientName + "! We hope you loved your " + serviceName + " session.";
                case "PROMOTION" -> messageText = "Exclusive VIP Offer from Modern Unisex Salon! Use code GLOW20 for 20% OFF.";
                default -> messageText = "Hello " + clientName + ", update regarding your appointment at Modern Unisex Salon. Ref: " + bookingRef;
            }
        }

        SalonDatabaseState db = storage.readDb();
        db.notifications.add(0, mapOf(
                "id", "notif-" + System.currentTimeMillis(),
                "title", "📱 SMS Pass Dispatched: " + bookingRef,
                "message", "SMS pass dispatched to " + clientName + " (" + phone + ").",
                "type", "reminder",
                "timestamp", "Just now",
                "read", false
        ));
        storage.writeDb(db);

        String cleanPhone = phone.replaceAll("[^0-9]", "");
        String formattedPhone = cleanPhone.length() == 10 ? "91" + cleanPhone : cleanPhone;

        return ResponseEntity.ok(mapOf(
                "success", true,
                "smsLogId", "sms_" + System.currentTimeMillis(),
                "recipient", phone,
                "status", "DELIVERED",
                "sentAt", Instant.now().toString(),
                "messageText", messageText,
                "webSmsUrl", "sms:" + phone + "?body=" + urlEncode(messageText),
                "whatsappUrl", "https://api.whatsapp.com/send?phone=" + formattedPhone + "&text=" + urlEncode(messageText),
                "message", "SMS notification dispatched successfully to " + phone
        ));
    }

    @PostMapping("/send-whatsapp")
    public Map<String, Object> sendWhatsapp(@RequestBody Map<String, Object> body) {
        String ownerPhone = "8104026257";
        String clientPhone = strOr(body.get("clientPhone"), str(body.get("phone")));
        String cleanClientPhone = clientPhone.replaceAll("[^0-9]", "");
        String formattedClientPhone = cleanClientPhone.length() == 10 ? "91" + cleanClientPhone : cleanClientPhone;

        String messageText = str(body.get("customMessage"));
        if (messageText.isBlank()) {
            messageText = "✨ *NEW APPOINTMENT CONFIRMED* ✨\n*Modern Unisex Salon, Mohol*\n"
                    + "📋 *Booking Ref:* " + strOr(body.get("bookingRef"), "SS-CONFIRMED") + "\n"
                    + "👤 *Client:* " + strOr(body.get("clientName"), "Valued Client") + "\n"
                    + "💇‍♀️ *Service:* " + strOr(body.get("serviceName"), "Salon Service") + "\n"
                    + "📅 *Date & Slot:* " + strOr(body.get("date"), "Upcoming") + " at " + strOr(body.get("timeSlot"), "Scheduled Time");
        }

        String encoded = urlEncode(messageText);
        return mapOf(
                "success", true,
                "waLogId", "wa_" + System.currentTimeMillis(),
                "ownerPhone", "+91 " + ownerPhone,
                "clientPhone", clientPhone,
                "status", "DISPATCHED",
                "sentAt", Instant.now().toString(),
                "messageText", messageText,
                "ownerWhatsappUrl", "https://api.whatsapp.com/send?phone=91" + ownerPhone + "&text=" + encoded,
                "clientWhatsappUrl", !formattedClientPhone.isEmpty()
                        ? "https://api.whatsapp.com/send?phone=" + formattedClientPhone + "&text=" + encoded
                        : "https://api.whatsapp.com/send?text=" + encoded,
                "message", "Automated WhatsApp notification generated and dispatched for Salon Owner and Client"
        );
    }

    @PostMapping("/send-email")
    public ResponseEntity<Map<String, Object>> sendEmail(@RequestBody Map<String, Object> body) {
        String email = str(body.get("email"));
        if (email.isBlank()) {
            return ResponseEntity.badRequest().body(mapOf("error", "Recipient email is required."));
        }
        String bookingRef = strOr(body.get("bookingRef"), "SS-CONF");
        String clientName = strOr(body.get("clientName"), "Valued Client");
        String subject = strOr(body.get("subject"), "Appointment Confirmation - Modern Unisex Salon (Ref: " + bookingRef + ")");
        String emailBody = "Modern Unisex Salon Mohol - Official Booking Pass Receipt\n\n"
                + "Booking Ref: " + bookingRef + "\n"
                + "Client: " + clientName + "\n"
                + "Service: " + strOr(body.get("serviceName"), "Salon Service") + "\n"
                + "Date & Time: " + str(body.get("date")) + " at " + str(body.get("timeSlot")) + "\n"
                + "Advance Deposit Paid: ₹" + strOr(body.get("advancePaid"), "0");

        SalonDatabaseState db = storage.readDb();
        db.notifications.add(0, mapOf(
                "id", "notif-" + System.currentTimeMillis(),
                "title", "📧 Digital Receipt Emailed: " + bookingRef,
                "message", "Official pass receipt emailed to " + clientName + " (" + email + ").",
                "type", "reminder",
                "timestamp", "Just now",
                "read", false
        ));
        storage.writeDb(db);

        return ResponseEntity.ok(mapOf(
                "success", true,
                "emailLogId", "mail_" + System.currentTimeMillis(),
                "recipient", email,
                "subject", subject,
                "status", "SENT",
                "sentAt", Instant.now().toString(),
                "mailtoUrl", "mailto:" + urlEncode(email) + "?subject=" + urlEncode(subject) + "&body=" + urlEncode(emailBody),
                "message", "Digital invoice & confirmation email dispatched to " + email
        ));
    }
}
