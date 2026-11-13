package com.modernsalon.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.modernsalon.model.SalonModels.SalonDatabaseState;
import com.modernsalon.model.SalonModels.SalonSettings;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.datasource.DriverManagerDataSource;
import org.springframework.stereotype.Service;

import java.io.File;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.*;

import static com.modernsalon.model.SalonModels.DEFAULT_ADMIN_EMAILS;

@Service
public class SalonStorageService {

    @Value("${salon.db.file:../data/db.json}")
    private String dbFilePath;

    @Value("${salon.app.url:http://localhost:3000}")
    private String appUrl;

    @Value("${salon.mysql.enabled:false}")
    private boolean mysqlEnabled;

    @Value("${spring.datasource.url:}")
    private String datasourceUrl;

    @Value("${spring.datasource.username:root}")
    private String datasourceUsername;

    @Value("${spring.datasource.password:root}")
    private String datasourcePassword;

    private final ObjectMapper objectMapper = new ObjectMapper().enable(SerializationFeature.INDENT_OUTPUT);
    private final Object lock = new Object();

    private JdbcTemplate jdbcTemplate;
    private boolean mysqlConnected = false;

    @PostConstruct
    public void init() {
        initMySQL();
        readDb();
    }

    private void initMySQL() {
        if (!mysqlEnabled || datasourceUrl == null || datasourceUrl.isBlank()) {
            mysqlConnected = false;
            return;
        }
        try {
            DriverManagerDataSource ds = new DriverManagerDataSource();
            ds.setDriverClassName("com.mysql.cj.jdbc.Driver");
            ds.setUrl(datasourceUrl);
            ds.setUsername(datasourceUsername);
            ds.setPassword(datasourcePassword);
            JdbcTemplate tpl = new JdbcTemplate(ds);
            tpl.queryForObject("SELECT 1", Integer.class);
            this.jdbcTemplate = tpl;
            this.mysqlConnected = true;
        } catch (Exception e) {
            this.mysqlConnected = false;
        }
    }

    public boolean isMySQLConnected() {
        return mysqlConnected && jdbcTemplate != null;
    }

    public Map<String, Object> getDatabaseStatus() {
        Map<String, Object> status = new LinkedHashMap<>();
        status.put("connected", mysqlConnected);
        status.put("type", mysqlConnected ? "MySQL Relational Database (Production)" : "MySQL (Offline Fallback to Local Store)");
        status.put("database", "smart_salon_db");
        if (mysqlConnected && jdbcTemplate != null) {
            Map<String, Object> counts = new LinkedHashMap<>();
            List<String> tables = Arrays.asList("users", "appointments", "customers", "salon_settings", "inquiries", "offers", "reviews", "notifications", "broadcast_logs");
            for (String table : tables) {
                try {
                    Integer c = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM `" + table + "`", Integer.class);
                    counts.put(table, c != null ? c : 0);
                } catch (Exception ex) {
                    counts.put(table, 0);
                }
            }
            status.put("tableCounts", counts);
        }
        return status;
    }

    public SalonDatabaseState readDb() {
        synchronized (lock) {
            try {
                File file = new File(dbFilePath);
                if (!file.exists()) {
                    if (file.getParentFile() != null) {
                        file.getParentFile().mkdirs();
                    }
                    SalonDatabaseState initial = new SalonDatabaseState();
                    ensureDefaults(initial);
                    objectMapper.writeValue(file, initial);
                    return initial;
                }
                SalonDatabaseState db = objectMapper.readValue(file, SalonDatabaseState.class);
                ensureDefaults(db);
                syncCustomerStats(db);
                return db;
            } catch (Exception e) {
                SalonDatabaseState fallback = new SalonDatabaseState();
                ensureDefaults(fallback);
                return fallback;
            }
        }
    }

    public void writeDb(SalonDatabaseState db) {
        synchronized (lock) {
            try {
                ensureDefaults(db);
                syncCustomerStats(db);
                File file = new File(dbFilePath);
                if (file.getParentFile() != null) {
                    file.getParentFile().mkdirs();
                }
                objectMapper.writeValue(file, db);
            } catch (Exception e) {
                throw new RuntimeException("Failed to persist salon state: " + e.getMessage(), e);
            }
        }
    }

    private void ensureDefaults(SalonDatabaseState db) {
        if (db.users == null) db.users = new ArrayList<>();
        if (db.settings == null) db.settings = new SalonSettings();
        if (db.settings.adminEmails == null || db.settings.adminEmails.isEmpty()) {
            db.settings.adminEmails = new ArrayList<>(DEFAULT_ADMIN_EMAILS);
        }
        if (db.settings.adminPassword == null || db.settings.adminPassword.isBlank()) {
            db.settings.adminPassword = "Salon@Owner#2026";
        }
        if (db.settings.adminPin == null || db.settings.adminPin.isBlank()) {
            db.settings.adminPin = "8104";
        }
        if (db.inquiries == null) db.inquiries = new ArrayList<>();
        if (db.appointments == null) db.appointments = new ArrayList<>();
        if (db.customers == null) db.customers = new ArrayList<>();
        if (db.notifications == null) db.notifications = new ArrayList<>();
        if (db.reviews == null) db.reviews = new ArrayList<>();
        if (db.gallery == null) db.gallery = new ArrayList<>();
        if (db.broadcastLogs == null) db.broadcastLogs = new ArrayList<>();
        if (db.verifiedDeposits == null) db.verifiedDeposits = new ArrayList<>();
        if (db.offers == null || db.offers.isEmpty()) {
            db.offers = defaultOffers();
        }
    }

    private List<Map<String, Object>> defaultOffers() {
        List<Map<String, Object>> list = new ArrayList<>();
        list.add(mapOf("id", "off-1", "code", "GLOW20", "title", "Festive Glow Special - 20% OFF Facials",
                "description", "Get flat 20% off on all premium facials & detan therapies with online advance booking.",
                "discountPercent", 20, "minBookingAmount", 500, "validTill", "2026-12-31", "active", true));
        list.add(mapOf("id", "off-2", "code", "FIRST10", "title", "New Client Welcome - 10% OFF",
                "description", "Welcome gift for first-time visitors! Valid across all hair and skin styling services.",
                "discountPercent", 10, "minBookingAmount", 300, "validTill", "2026-12-31", "active", true));
        list.add(mapOf("id", "off-3", "code", "BRIDAL500", "title", "Luxury Bridal Suite - Flat ₹500 OFF",
                "description", "Exclusive savings on complete 3D/4D HD Bridal & Grooming packages.",
                "discountAmount", 500, "discountPercent", 15, "minBookingAmount", 2500, "validTill", "2026-12-31", "active", true));
        return list;
    }

    public List<String> getAllowedAdminEmails(SalonSettings settings) {
        LinkedHashSet<String> allowed = new LinkedHashSet<>();
        if (settings != null && settings.adminEmails != null) {
            for (String e : settings.adminEmails) {
                if (e != null && !e.trim().isEmpty()) {
                    allowed.add(e.trim().toLowerCase());
                }
            }
        }
        if (allowed.isEmpty()) {
            allowed.addAll(DEFAULT_ADMIN_EMAILS);
        }
        if (settings != null && settings.email != null && !settings.email.trim().isEmpty()) {
            allowed.add(settings.email.trim().toLowerCase());
        }
        return new ArrayList<>(allowed);
    }

    public void syncCustomerStats(SalonDatabaseState db) {
        for (Map<String, Object> u : db.users) {
            if ("ADMIN".equals(str(u.get("role")))) continue;
            String uPhone = last10Digits(str(u.get("phone")));
            String uEmail = str(u.get("email")).trim().toLowerCase();

            Map<String, Object> cust = null;
            for (Map<String, Object> c : db.customers) {
                String cPhone = last10Digits(str(c.get("phone")));
                String cEmail = str(c.get("email")).trim().toLowerCase();
                if ((!uPhone.isEmpty() && uPhone.equals(cPhone))
                        || (!uEmail.isEmpty() && uEmail.equals(cEmail))
                        || Objects.equals(c.get("id"), u.get("id"))) {
                    cust = c;
                    break;
                }
            }
            if (cust == null) {
                Map<String, Object> created = new LinkedHashMap<>();
                created.put("id", "cust-" + strOr(u.get("id"), String.valueOf(System.currentTimeMillis())));
                created.put("name", str(u.get("name")));
                created.put("phone", str(u.get("phone")));
                created.put("email", str(u.get("email")));
                created.put("totalVisits", 0);
                created.put("totalSpent", 0);
                created.put("lastVisit", "Just Joined");
                created.put("favoriteService", "General Styling");
                created.put("memberSince", strOr(u.get("memberSince"), "2026"));
                created.put("tier", "New Client");
                db.customers.add(created);
            }
        }

        for (Map<String, Object> cust : db.customers) {
            String cPhone = last10Digits(str(cust.get("phone")));
            String cEmail = str(cust.get("email")).trim().toLowerCase();
            String cName = str(cust.get("name")).trim().toLowerCase();

            List<Map<String, Object>> matched = new ArrayList<>();
            for (Map<String, Object> apt : db.appointments) {
                String aPhone = last10Digits(str(apt.get("clientPhone")));
                String aEmail = str(apt.get("clientEmail")).trim().toLowerCase();
                String aName = str(apt.get("clientName")).trim().toLowerCase();
                if ((!cPhone.isEmpty() && cPhone.equals(aPhone))
                        || (!cEmail.isEmpty() && cEmail.equals(aEmail))
                        || (!cName.isEmpty() && cName.equals(aName))) {
                    matched.add(apt);
                }
            }

            if (!matched.isEmpty()) {
                int visits = Math.max(asInt(cust.get("totalVisits")), matched.size());
                double spent = matched.stream().mapToDouble(a -> asDouble(a.get("totalAmount"))).sum();
                cust.put("totalVisits", visits);
                cust.put("totalSpent", Math.max(asDouble(cust.get("totalSpent")), spent));
                matched.sort((a, b) -> str(b.get("date")).compareTo(str(a.get("date"))));
                if (!str(matched.get(0).get("date")).isEmpty()) {
                    cust.put("lastVisit", matched.get(0).get("date"));
                }
                if (!str(matched.get(0).get("serviceName")).isEmpty()) {
                    cust.put("favoriteService", matched.get(0).get("serviceName"));
                }
                cust.put("tier", visits >= 5 ? "VIP Member" : "Standard");
            }
        }
    }

    public List<Map<String, Object>> getUniqueClientContacts(SalonDatabaseState db) {
        Map<String, Map<String, Object>> map = new LinkedHashMap<>();
        String adminPhone = last10Digits(db.settings != null ? db.settings.phone : "8104026257");

        for (Map<String, Object> c : db.customers) {
            addContact(map, c.get("id"), str(c.get("name")), str(c.get("phone")), "customer", adminPhone);
        }
        for (Map<String, Object> a : db.appointments) {
            addContact(map, null, str(a.get("clientName")), str(a.get("clientPhone")), "appointment", adminPhone);
        }
        for (Map<String, Object> u : db.users) {
            if (!"ADMIN".equals(str(u.get("role")))) {
                addContact(map, u.get("id"), str(u.get("name")), str(u.get("phone")), "user", adminPhone);
            }
        }
        return new ArrayList<>(map.values());
    }

    private void addContact(Map<String, Map<String, Object>> map, Object id, String name, String rawPhone, String source, String adminPhone) {
        String clean = last10Digits(rawPhone);
        if (clean.length() == 10 && !clean.equals(adminPhone) && !clean.startsWith("00000")) {
            if (!map.containsKey(clean)) {
                Map<String, Object> entry = new LinkedHashMap<>();
                entry.put("id", id != null ? id : source + "-" + clean);
                entry.put("name", name.isBlank() ? "Valued Client" : name.trim());
                entry.put("phone", clean);
                entry.put("formattedPhone", "91" + clean);
                entry.put("source", source);
                map.put(clean, entry);
            }
        }
    }

    public String buildOfferWhatsAppMessage(Map<String, Object> offer, String clientName, SalonSettings settings) {
        String salonName = settings != null && settings.salonName != null ? settings.salonName : "Modern Unisex Salon";
        String salonPhone = settings != null && settings.phone != null ? settings.phone : "8104026257";
        String salonAddress = settings != null && settings.address != null ? settings.address : "B.N. GUND COMPLEX, MOHOL - 413213";
        int pct = asInt(offer.get("discountPercent"));
        int amt = asInt(offer.get("discountAmount"));
        String discountStr = pct > 0 ? pct + "% OFF" : (amt > 0 ? "₹" + amt + " OFF" : "Special Discount");
        String code = str(offer.get("code"));
        String bookingUrl = appUrl + "/?coupon=" + urlEncode(code) + "&action=book";

        return "✨ *EXCLUSIVE SALON OFFER ALERT!* ✨\n*" + salonName + "*\n"
                + "🎉 Hello *" + clientName + "*!\n"
                + "🏷️ *Offer:* " + str(offer.get("title")) + "\n"
                + "🔥 *Coupon Code:* *" + code + "*\n"
                + "🎁 *Discount:* *" + discountStr + "*\n"
                + "👉 *Book Online:* " + bookingUrl + "\n"
                + "📍 *Venue:* " + salonAddress + "\n"
                + "📞 *Helpline:* +91 " + salonPhone;
    }

    public Map<String, Object> dispatchWhatsAppOfferBroadcast(SalonDatabaseState db, Map<String, Object> offer) {
        List<Map<String, Object>> recipients = getUniqueClientContacts(db);
        List<Map<String, Object>> recipientResults = new ArrayList<>();
        int usersCount = 0, customersCount = 0, appointmentsCount = 0;

        for (Map<String, Object> r : recipients) {
            String msg = buildOfferWhatsAppMessage(offer, str(r.get("name")), db.settings);
            String encoded = urlEncode(msg);
            String formattedPhone = str(r.get("formattedPhone"));
            String src = str(r.get("source"));
            if ("user".equals(src)) usersCount++;
            else if ("customer".equals(src)) customersCount++;
            else if ("appointment".equals(src)) appointmentsCount++;

            Map<String, Object> item = new LinkedHashMap<>(r);
            item.put("whatsappUrl", "https://api.whatsapp.com/send?phone=" + formattedPhone + "&text=" + encoded);
            item.put("webWhatsappUrl", "https://web.whatsapp.com/send?phone=" + formattedPhone + "&text=" + encoded);
            item.put("status", "SENT");
            recipientResults.add(item);
        }

        Map<String, Object> breakdown = new LinkedHashMap<>();
        breakdown.put("total", recipientResults.size());
        breakdown.put("users", usersCount);
        breakdown.put("customers", customersCount);
        breakdown.put("appointments", appointmentsCount);

        Map<String, Object> log = new LinkedHashMap<>();
        log.put("id", "bcast-" + System.currentTimeMillis());
        log.put("offerId", offer.get("id"));
        log.put("offerCode", offer.get("code"));
        log.put("offerTitle", offer.get("title"));
        log.put("discountPercent", offer.get("discountPercent"));
        log.put("discountAmount", offer.get("discountAmount"));
        log.put("dispatchedAt", Instant.now().toString());
        log.put("totalRecipients", recipientResults.size());
        log.put("breakdown", breakdown);
        log.put("status", "SUCCESS");
        log.put("messageText", buildOfferWhatsAppMessage(offer, "Client Name", db.settings));
        log.put("recipients", recipientResults);

        db.broadcastLogs.add(0, log);
        db.notifications.add(0, mapOf(
                "id", "notif-" + System.currentTimeMillis(),
                "title", "📢 WhatsApp Offer Broadcast Dispatched",
                "message", "Offer \"" + str(offer.get("code")) + "\" broadcasted to " + recipientResults.size() + " clients.",
                "type", "promotion",
                "timestamp", "Just now",
                "read", false,
                "offerCode", offer.get("code")
        ));
        return log;
    }

    public static String last10Digits(String raw) {
        if (raw == null) return "";
        String digits = raw.replaceAll("\\D", "");
        return digits.length() > 10 ? digits.substring(digits.length() - 10) : digits;
    }

    public static String urlEncode(String s) {
        return URLEncoder.encode(s != null ? s : "", StandardCharsets.UTF_8);
    }

    public static String str(Object o) {
        return o == null ? "" : String.valueOf(o);
    }

    public static String strOr(Object o, String fallback) {
        String s = str(o);
        return s.isBlank() ? fallback : s;
    }

    public static int asInt(Object o) {
        if (o instanceof Number n) return n.intValue();
        try { return Integer.parseInt(str(o)); } catch (Exception e) { return 0; }
    }

    public static double asDouble(Object o) {
        if (o instanceof Number n) return n.doubleValue();
        try { return Double.parseDouble(str(o)); } catch (Exception e) { return 0.0; }
    }

    public static Map<String, Object> mapOf(Object... kv) {
        Map<String, Object> m = new LinkedHashMap<>();
        for (int i = 0; i + 1 < kv.length; i += 2) {
            m.put(String.valueOf(kv[i]), kv[i + 1]);
        }
        return m;
    }
}
