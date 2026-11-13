package com.modernsalon.service;

import org.springframework.stereotype.Service;

import java.util.LinkedHashMap;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class BankSmsParserService {

    private static final Pattern UTR_PREFIXED = Pattern.compile("(?:UPI[:\\s/-]|Ref(?:\\s*no)?[:\\s/-]|UTR[:\\s/-]|RRN[:\\s/-]|/)\\s*([0-9]{12})", Pattern.CASE_INSENSITIVE);
    private static final Pattern UTR_PLAIN = Pattern.compile("\\b([0-9]{12})\\b");
    private static final Pattern AMOUNT_CURRENCY = Pattern.compile("(?:INR|Rs\\.?|₹)\\s*([\\d,]+(?:\\.\\d{1,2})?)", Pattern.CASE_INSENSITIVE);
    private static final Pattern AMOUNT_PHRASE = Pattern.compile("(?:credited with|received|deposit of)\\s*(?:INR|Rs\\.?|₹)?\\s*([\\d,]+(?:\\.\\d{1,2})?)", Pattern.CASE_INSENSITIVE);

    public Map<String, Object> parseBankSms(String rawText, String sender) {
        String text = rawText == null ? "" : rawText.trim();
        String lower = text.toLowerCase();

        boolean isCredit = (lower.contains("credit") || lower.contains("credited") || lower.contains("received")
                || lower.contains("deposit") || lower.contains("deposited") || lower.contains("recvd"))
                && !lower.contains("debited from") && !lower.contains("sent to");

        String utr = null;
        Matcher m1 = UTR_PREFIXED.matcher(text);
        if (m1.find()) {
            utr = m1.group(1);
        } else {
            Matcher m2 = UTR_PLAIN.matcher(text);
            if (m2.find()) {
                utr = m2.group(1);
            }
        }

        double amount = 0.0;
        Matcher a1 = AMOUNT_CURRENCY.matcher(text);
        if (!a1.find()) {
            a1 = AMOUNT_PHRASE.matcher(text);
            if (a1.find()) {
                amount = parseAmount(a1.group(1));
            }
        } else {
            amount = parseAmount(a1.group(1));
        }

        String bankName = "HDFC Bank (Current A/c 50200072074441)";
        String senderUpper = sender == null ? "" : sender.toUpperCase();
        if (senderUpper.contains("PHONEPE") || lower.contains("phonepe") || lower.contains("ybl") || lower.contains("axl")) {
            bankName = "PhonePe Merchant Account (ghodakedinesh@ybl)";
        } else if (senderUpper.contains("BOI") || lower.contains("bkid") || lower.contains("bank of india") || text.contains("0428")) {
            bankName = "Bank of India (A/c ...0428)";
        } else if (senderUpper.contains("HDFC") || lower.contains("hdfc") || text.contains("74441") || lower.contains("modern jents")) {
            bankName = "HDFC Bank (Current A/c ...74441)";
        }

        Map<String, Object> parsed = new LinkedHashMap<>();
        parsed.put("isCredit", isCredit);
        parsed.put("utr", utr);
        parsed.put("amount", amount);
        parsed.put("bankName", bankName);
        parsed.put("rawText", rawText);
        return parsed;
    }

    private double parseAmount(String val) {
        try {
            return Double.parseDouble(val.replace(",", ""));
        } catch (Exception e) {
            return 0.0;
        }
    }
}
