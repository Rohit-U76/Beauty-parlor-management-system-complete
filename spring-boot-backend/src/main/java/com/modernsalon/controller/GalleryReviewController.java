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
import java.time.LocalDate;
import java.util.*;

import static com.modernsalon.service.SalonStorageService.*;

@RestController
@RequestMapping("/api")
public class GalleryReviewController {

    private final SalonStorageService storage;

    @Value("${salon.uploads.dir:../public/uploads}")
    private String uploadsDir;

    public GalleryReviewController(SalonStorageService storage) {
        this.storage = storage;
    }

    @PostMapping("/gallery/upload-video")
    public ResponseEntity<Map<String, Object>> uploadVideo(@RequestBody Map<String, Object> body) {
        try {
            String videoBase64 = str(body.get("videoBase64"));
            if (videoBase64.isEmpty()) {
                return ResponseEntity.badRequest().body(mapOf("success", false, "message", "No video data provided in request"));
            }
            String ext = "mp4";
            String payload = videoBase64;
            if (videoBase64.startsWith("data:") && videoBase64.contains(",")) {
                String header = videoBase64.substring(0, videoBase64.indexOf(",")).toLowerCase();
                if (header.contains("webm")) ext = "webm";
                else if (header.contains("ogg")) ext = "ogg";
                else if (header.contains("quicktime")) ext = "mov";
                payload = videoBase64.substring(videoBase64.indexOf(",") + 1);
            }
            byte[] bytes = Base64.getDecoder().decode(payload);
            String sanitized = strOr(body.get("fileName"), "salon_reel").replaceAll("\\.[^.]+$", "").replaceAll("[^a-zA-Z0-9_-]", "_");
            String filename = "video_" + System.currentTimeMillis() + "_" + sanitized.substring(0, Math.min(30, sanitized.length())) + "." + ext;
            Path dir = Paths.get(uploadsDir, "videos").toAbsolutePath().normalize();
            Files.createDirectories(dir);
            Files.write(dir.resolve(filename), bytes);
            return ResponseEntity.ok(mapOf("success", true, "videoUrl", "/uploads/videos/" + filename, "filename", filename, "sizeBytes", bytes.length));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(mapOf("success", false, "message", e.getMessage()));
        }
    }

    @GetMapping("/gallery")
    public Map<String, Object> listGallery() {
        return mapOf("success", true, "gallery", storage.readDb().gallery);
    }

    @PostMapping("/gallery")
    public Map<String, Object> saveGalleryItem(@RequestBody Map<String, Object> body) {
        SalonDatabaseState db = storage.readDb();
        String id = strOr(body.get("id"), "gal-" + System.currentTimeMillis());
        Map<String, Object> item = new LinkedHashMap<>(body);
        item.put("id", id);
        db.gallery.removeIf(g -> id.equals(str(g.get("id"))));
        db.gallery.add(0, item);
        storage.writeDb(db);
        return mapOf("success", true, "item", item, "gallery", db.gallery);
    }

    @PutMapping("/gallery/{id}")
    public Map<String, Object> updateGalleryItem(@PathVariable String id, @RequestBody Map<String, Object> body) {
        SalonDatabaseState db = storage.readDb();
        Map<String, Object> updated = new LinkedHashMap<>(body);
        updated.put("id", id);
        boolean found = false;
        for (int i = 0; i < db.gallery.size(); i++) {
            if (id.equals(str(db.gallery.get(i).get("id")))) {
                Map<String, Object> merged = new LinkedHashMap<>(db.gallery.get(i));
                merged.putAll(updated);
                db.gallery.set(i, merged);
                updated = merged;
                found = true;
                break;
            }
        }
        if (!found) db.gallery.add(0, updated);
        storage.writeDb(db);
        return mapOf("success", true, "item", updated, "gallery", db.gallery);
    }

    @DeleteMapping("/gallery/{id}")
    public Map<String, Object> deleteGalleryItem(@PathVariable String id) {
        SalonDatabaseState db = storage.readDb();
        db.gallery.removeIf(g -> id.equals(str(g.get("id"))));
        storage.writeDb(db);
        return mapOf("success", true, "gallery", db.gallery);
    }

    @GetMapping("/reviews")
    public List<Map<String, Object>> listReviews() {
        SalonDatabaseState db = storage.readDb();
        List<Map<String, Object>> result = new ArrayList<>();
        for (Map<String, Object> r : db.reviews) {
            Map<String, Object> safe = new LinkedHashMap<>(r);
            String client = strOr(r.get("clientName"), strOr(r.get("userName"), "Valued Client"));
            safe.put("clientName", client);
            safe.put("userName", strOr(r.get("userName"), client));
            safe.put("serviceName", strOr(r.get("serviceName"), "Signature Salon Service"));
            result.add(safe);
        }
        return result;
    }

    @PostMapping("/reviews")
    public ResponseEntity<Map<String, Object>> createReview(@RequestBody Map<String, Object> body) {
        SalonDatabaseState db = storage.readDb();
        Map<String, Object> rev = new LinkedHashMap<>(body);
        rev.put("id", strOr(body.get("id"), "rev-" + System.currentTimeMillis()));
        rev.put("date", strOr(body.get("date"), LocalDate.now().toString()));
        db.reviews.add(0, rev);
        storage.writeDb(db);
        return ResponseEntity.status(HttpStatus.CREATED).body(mapOf("success", true, "review", rev));
    }

    @PutMapping("/reviews/{id}")
    public Map<String, Object> updateReview(@PathVariable String id, @RequestBody Map<String, Object> body) {
        SalonDatabaseState db = storage.readDb();
        Map<String, Object> updated = new LinkedHashMap<>(body);
        updated.put("id", id);
        boolean found = false;
        for (int i = 0; i < db.reviews.size(); i++) {
            if (id.equals(str(db.reviews.get(i).get("id")))) {
                Map<String, Object> merged = new LinkedHashMap<>(db.reviews.get(i));
                merged.putAll(updated);
                db.reviews.set(i, merged);
                updated = merged;
                found = true;
                break;
            }
        }
        if (!found) db.reviews.add(0, updated);
        storage.writeDb(db);
        return mapOf("success", true, "review", updated);
    }
}
