package com.modernsalon.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.modernsalon.model.SalonModels.SalonDatabaseState;
import com.modernsalon.service.SalonStorageService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.nio.charset.StandardCharsets;
import java.time.Year;
import java.util.*;

import static com.modernsalon.service.SalonStorageService.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final SalonStorageService storage;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public AuthController(SalonStorageService storage) {
        this.storage = storage;
    }

    @PostMapping("/register")
    public ResponseEntity<Map<String, Object>> register(@RequestBody Map<String, Object> body) {
        String name = str(body.get("name")).trim();
        String phone = str(body.get("phone")).trim();
        String password = str(body.get("password"));
        String email = str(body.get("email")).toLowerCase().trim();
        String username = str(body.get("username")).toLowerCase().trim();

        if (name.isEmpty() || phone.isEmpty() || password.isEmpty()) {
            return ResponseEntity.badRequest().body(mapOf("success", false,
                    "message", "Name, phone number, and password are required to create an account."));
        }

        String cleanPhone = phone.replaceAll("[^0-9]", "");
        String cleanUsername = !username.isEmpty() ? username
                : (!email.isEmpty() ? email.split("@")[0] : "user_" + (cleanPhone.length() >= 4 ? cleanPhone.substring(cleanPhone.length() - 4) : cleanPhone));

        SalonDatabaseState db = storage.readDb();
        for (Map<String, Object> u : db.users) {
            String uEmail = str(u.get("email")).toLowerCase();
            String uPhone = str(u.get("phone")).replaceAll("[^0-9]", "");
            String uUser = str(u.get("username")).toLowerCase();
            if ((!email.isEmpty() && email.equals(uEmail))
                    || (!cleanPhone.isEmpty() && cleanPhone.equals(uPhone))
                    || (!cleanUsername.isEmpty() && cleanUsername.equals(uUser))) {
                return ResponseEntity.badRequest().body(mapOf("success", false,
                        "message", "An account with this mobile number, username, or email already exists. Please sign in."));
            }
        }

        Map<String, Object> newUser = new LinkedHashMap<>();
        newUser.put("id", "usr-cust-" + System.currentTimeMillis());
        newUser.put("name", name);
        newUser.put("username", cleanUsername);
        newUser.put("email", email);
        newUser.put("phone", cleanPhone);
        newUser.put("password", password);
        newUser.put("role", "CUSTOMER");
        newUser.put("memberTier", "Silver VIP");
        newUser.put("totalVisits", 0);
        newUser.put("memberSince", String.valueOf(Year.now().getValue()));
        newUser.put("preferredServices", body.getOrDefault("preferredServices", new ArrayList<>()));

        db.users.add(newUser);
        storage.writeDb(db);

        return ResponseEntity.ok(mapOf("success", true, "user", newUser, "message", "Account successfully registered!"));
    }

    @PostMapping("/login")
    public ResponseEntity<Map<String, Object>> login(@RequestBody Map<String, Object> body) {
        String identifier = str(body.get("identifier"));
        String password = str(body.get("password"));
        String role = str(body.get("role"));

        if (identifier.isBlank() || password.isBlank()) {
            return ResponseEntity.badRequest().body(mapOf("success", false, "message", "Username/phone and password are required."));
        }

        SalonDatabaseState db = storage.readDb();
        String cleanIdent = identifier.toLowerCase().trim();
        String cleanNum = identifier.replaceAll("[^0-9]", "");

        if ("ADMIN".equalsIgnoreCase(role)) {
            String adminPass = strOr(db.settings != null ? db.settings.adminPassword : null, "Salon@Owner#2026");
            String adminPin = strOr(db.settings != null ? db.settings.adminPin : null, "8104");
            List<String> allowedAdminEmails = storage.getAllowedAdminEmails(db.settings);
            String salonPhone = db.settings != null && db.settings.phone != null
                    ? db.settings.phone.replaceAll("[^0-9]", "") : "8104026257";

            boolean isMasterPassMatch = password.equals(adminPass) || (!adminPin.isBlank() && password.equals(adminPin));
            boolean isRecognizedAdminIdent = "admin".equals(cleanIdent)
                    || "owner".equals(cleanIdent)
                    || allowedAdminEmails.contains(cleanIdent)
                    || (!cleanNum.isEmpty() && cleanNum.equals(salonPhone));

            if (isMasterPassMatch && isRecognizedAdminIdent) {
                String matchedEmail = allowedAdminEmails.contains(cleanIdent)
                        ? cleanIdent
                        : allowedAdminEmails.get(0);

                Map<String, Object> adminUser = db.users.stream()
                        .filter(u -> "ADMIN".equals(str(u.get("role"))))
                        .findFirst()
                        .map(LinkedHashMap::new)
                        .orElseGet(() -> {
                            LinkedHashMap<String, Object> m = new LinkedHashMap<>();
                            m.put("id", "usr-admin-owner");
                            m.put("name", "Salon Owner");
                            m.put("username", "admin");
                            m.put("phone", salonPhone);
                            m.put("role", "ADMIN");
                            m.put("memberTier", "Owner Admin");
                            m.put("memberSince", "2022");
                            return m;
                        });
                adminUser.put("email", matchedEmail);
                return ResponseEntity.ok(mapOf("success", true, "user", adminUser,
                        "message", "Welcome back, Salon Owner (" + matchedEmail + ")! Admin suite unlocked."));
            }

            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(mapOf("success", false,
                    "message", "Invalid admin credentials. Please check your authorized admin email/username and shared password or PIN."));
        }

        for (Map<String, Object> u : db.users) {
            if ("ADMIN".equals(str(u.get("role")))) continue;
            String uEmail = str(u.get("email")).toLowerCase();
            String uUser = str(u.get("username")).toLowerCase();
            String uPhone = str(u.get("phone")).replaceAll("[^0-9]", "");
            boolean matchesIdent = uEmail.equals(cleanIdent) || uUser.equals(cleanIdent) || (!cleanNum.isEmpty() && uPhone.equals(cleanNum));
            if (matchesIdent && (password.equals(str(u.get("password"))) || password.equals(str(u.get("pin"))))) {
                return ResponseEntity.ok(mapOf("success", true, "user", u, "message", "Welcome back, " + str(u.get("name")) + "!"));
            }
        }

        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(mapOf("success", false,
                "message", "Invalid credentials. Please verify your mobile/email and password or PIN."));
    }

    @PostMapping("/admin-reset-password")
    public ResponseEntity<Map<String, Object>> adminResetPassword(@RequestBody Map<String, Object> body) {
        String pin = str(body.get("pin")).trim();
        String newPassword = str(body.get("newPassword")).trim();
        SalonDatabaseState db = storage.readDb();
        String validPin = strOr(db.settings != null ? db.settings.adminPin : null, "8104").trim();

        if (pin.isEmpty() || !pin.equals(validPin)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(mapOf("success", false,
                    "message", "Invalid Owner Master Security PIN."));
        }
        if (newPassword.length() < 6) {
            return ResponseEntity.badRequest().body(mapOf("success", false,
                    "message", "New Admin password must be at least 6 characters."));
        }

        db.settings.adminPassword = newPassword;
        db.settings.adminPasswordUpdatedAt = System.currentTimeMillis();
        storage.writeDb(db);

        return ResponseEntity.ok(mapOf("success", true, "settings", db.settings,
                "message", "Admin Master Password updated successfully!"));
    }

    @PostMapping("/google")
    public ResponseEntity<Map<String, Object>> googleAuth(@RequestBody Map<String, Object> body) {
        String email = "";
        String name = "";
        String avatarUrl = "";
        String googleId = "";

        Object profileObj = body.get("profile");
        if (profileObj instanceof Map<?, ?> profile) {
            email = str(profile.get("email")).toLowerCase().trim();
            name = strOr(profile.get("name"), email.contains("@") ? email.split("@")[0] : "Google User");
            avatarUrl = str(profile.get("picture"));
            googleId = strOr(profile.get("sub"), "g_" + System.currentTimeMillis());
        } else if (body.get("credential") != null) {
            try {
                String[] parts = str(body.get("credential")).split("\\.");
                if (parts.length == 3) {
                    byte[] decoded = Base64.getUrlDecoder().decode(parts[1]);
                    JsonNode payload = objectMapper.readTree(new String(decoded, StandardCharsets.UTF_8));
                    email = payload.path("email").asText("").toLowerCase().trim();
                    name = payload.path("name").asText(email.contains("@") ? email.split("@")[0] : "Google User");
                    avatarUrl = payload.path("picture").asText("");
                    googleId = payload.path("sub").asText("");
                }
            } catch (Exception ignored) {}
        }

        if (email.isEmpty()) {
            return ResponseEntity.badRequest().body(mapOf("success", false,
                    "message", "Google account email could not be verified."));
        }

        SalonDatabaseState db = storage.readDb();
        Map<String, Object> user = null;
        for (Map<String, Object> u : db.users) {
            if (email.equalsIgnoreCase(str(u.get("email"))) || (!googleId.isEmpty() && googleId.equals(str(u.get("googleId"))))) {
                user = u;
                break;
            }
        }

        boolean isNewUser = false;
        if (user == null) {
            String cleanUsername = email.split("@")[0].replaceAll("[^a-zA-Z0-9_]", "_");
            user = new LinkedHashMap<>();
            user.put("id", "usr-google-" + System.currentTimeMillis());
            user.put("name", name.isEmpty() ? "Google User" : name);
            user.put("username", cleanUsername);
            user.put("email", email);
            user.put("phone", "");
            user.put("role", "CUSTOMER");
            user.put("memberTier", "Silver VIP");
            user.put("totalVisits", 0);
            user.put("memberSince", String.valueOf(Year.now().getValue()));
            user.put("preferredServices", new ArrayList<>());
            user.put("avatarUrl", avatarUrl);
            user.put("googleId", googleId);
            user.put("password", "google_oauth_" + (googleId.isEmpty() ? System.currentTimeMillis() : googleId));
            db.users.add(user);
            isNewUser = true;
        } else {
            if (!googleId.isEmpty() && str(user.get("googleId")).isEmpty()) user.put("googleId", googleId);
            if (!avatarUrl.isEmpty() && str(user.get("avatarUrl")).isEmpty()) user.put("avatarUrl", avatarUrl);
        }

        storage.writeDb(db);
        return ResponseEntity.ok(mapOf("success", true, "user", user, "isNewUser", isNewUser,
                "message", isNewUser ? "Welcome to Modern Unisex Salon, " + str(user.get("name")) + "!"
                        : "Welcome back, " + str(user.get("name")) + "! Signed in with Google."));
    }

    @GetMapping("/users")
    public Map<String, Object> getUsers() {
        SalonDatabaseState db = storage.readDb();
        return mapOf("success", true, "users", db.users);
    }

    @PutMapping("/users/{id}")
    public Map<String, Object> updateUser(@PathVariable String id, @RequestBody Map<String, Object> updates) {
        SalonDatabaseState db = storage.readDb();
        Map<String, Object> safeUpdates = new LinkedHashMap<>(updates);
        safeUpdates.remove("role");
        safeUpdates.remove("pin");

        int idx = -1;
        for (int i = 0; i < db.users.size(); i++) {
            if (id.equals(str(db.users.get(i).get("id")))) {
                idx = i;
                break;
            }
        }
        if (idx == -1) {
            String cleanPhone = str(safeUpdates.get("phone")).replaceAll("[^0-9]", "");
            String cleanEmail = str(safeUpdates.get("email")).toLowerCase().trim();
            for (int i = 0; i < db.users.size(); i++) {
                Map<String, Object> u = db.users.get(i);
                if ("ADMIN".equals(str(u.get("role")))) continue;
                String uPhone = str(u.get("phone")).replaceAll("[^0-9]", "");
                String uEmail = str(u.get("email")).toLowerCase().trim();
                if ((!cleanEmail.isEmpty() && cleanEmail.equals(uEmail)) || (!cleanPhone.isEmpty() && cleanPhone.equals(uPhone))) {
                    idx = i;
                    break;
                }
            }
        }

        Map<String, Object> updatedUser;
        if (idx == -1) {
            updatedUser = new LinkedHashMap<>();
            updatedUser.put("id", id);
            updatedUser.put("role", "CUSTOMER");
            updatedUser.put("memberTier", "Silver VIP");
            updatedUser.put("totalVisits", 0);
            updatedUser.put("memberSince", String.valueOf(Year.now().getValue()));
            updatedUser.put("preferredServices", new ArrayList<>());
            updatedUser.putAll(safeUpdates);
            db.users.add(updatedUser);
        } else {
            Map<String, Object> existing = db.users.get(idx);
            if (str(safeUpdates.get("phone")).isEmpty() && !str(existing.get("phone")).isEmpty()) {
                safeUpdates.put("phone", existing.get("phone"));
            }
            updatedUser = new LinkedHashMap<>(existing);
            updatedUser.putAll(safeUpdates);
            db.users.set(idx, updatedUser);
        }

        storage.writeDb(db);
        return mapOf("success", true, "user", updatedUser, "message", "Profile updated and saved to database successfully");
    }
}
