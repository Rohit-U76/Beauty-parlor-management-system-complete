package com.modernsalon.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonInclude;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class SalonModels {

    public static final List<String> DEFAULT_ADMIN_EMAILS = Arrays.asList(
            "dineshghodake941@gmail.com",
            "rohitumdale@gmail.com",
            "modernsalon02@gmail.com",
            "admin@modernsalon.com"
    );

    @JsonIgnoreProperties(ignoreUnknown = true)
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class SalonSettings {
        public String salonName = "Modern Unisex Salon";
        public String tagline = "WE'LL STYLE YOU'LL SMILE";
        public String phone = "8104026257";
        public String email = "dineshghodake941@gmail.com";
        public String address = "B.N. GUND COMPLEX, NEAR KANYA PRASHALA AND ICICI BANK, MOHOL - 413213";
        public String openingHours = "Mon - Sun: 09:00 AM - 10:00 PM";
        public Integer advancePercentage = 10;
        public String currencySymbol = "₹";
        public String razorpayKeyId = "rzp_test_modern_salon_mohol";
        public String razorpayKeySecret;
        public Boolean bookingAutoConfirm = false;
        public String instagramUrl = "https://www.instagram.com/modern_unisex_salon_mohol?utm_source=qr";
        public String mapsUrl = "https://maps.app.goo.gl/CraeBa6gAjWA8o818";
        public String gstNumber = "27AABCM8104M1Z2 (Available on Invoice)";
        public String staffType = "Self-Employed (Master Stylist & Founder)";
        public String accountHolder = "MODERN JENTS PARLOUR";
        public String bankName = "HDFC Bank";
        public String bankAccountNumber = "50200072074441";
        public String bankIfsc = "HDFC0000635";
        public String bankBranch = "Solapur";
        public String bankAccountType = "Current Account";
        public String merchantUpiId = "ghodakedinesh@ybl";
        public String upiId = "ghodakedinesh@ybl";
        public String upiQrCodeUrl = "/assets/aistudio/image_2ca5cc29.png";
        public String secondaryUpiId = "8104026257@axl";
        public String secondaryAccountHolder = "DINESH VITTHAL GHODAKE";
        public String secondaryUpiQrCodeUrl = "/assets/aistudio/image_fce20bf8.png";

        // 4 Authorized Admin Emails sharing one Admin Master Password
        public List<String> adminEmails = new ArrayList<>(DEFAULT_ADMIN_EMAILS);
        public String adminPassword = "Salon@Owner#2026";
        public Long adminPasswordUpdatedAt;
        public String adminPin = "8104";

        public List<Map<String, Object>> blockedWindows = new ArrayList<>();
        public Boolean isOwnerOnBreakToday = false;
        public String breakNoticeMessage = "The salon owner is taking a short break. Booking slots are temporarily unavailable.";
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class SalonDatabaseState {
        public List<Map<String, Object>> users = new ArrayList<>();
        public SalonSettings settings = new SalonSettings();
        public List<Map<String, Object>> inquiries = new ArrayList<>();
        public List<Map<String, Object>> appointments = new ArrayList<>();
        public List<Map<String, Object>> customers = new ArrayList<>();
        public List<Map<String, Object>> notifications = new ArrayList<>();
        public List<Map<String, Object>> reviews = new ArrayList<>();
        public List<Map<String, Object>> offers = new ArrayList<>();
        public List<Map<String, Object>> gallery = new ArrayList<>();
        public List<Map<String, Object>> broadcastLogs = new ArrayList<>();
        public List<Map<String, Object>> verifiedDeposits = new ArrayList<>();
        public Map<String, Object> extra = new HashMap<>();
    }
}
