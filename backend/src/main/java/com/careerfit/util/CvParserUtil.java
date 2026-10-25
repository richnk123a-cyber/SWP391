package com.careerfit.util;

import lombok.extern.slf4j.Slf4j;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.apache.poi.xwpf.extractor.XWPFWordExtractor;
import org.apache.poi.xwpf.usermodel.XWPFDocument;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;

import java.io.ByteArrayInputStream;
import java.io.InputStream;

@Component
@Slf4j
public class CvParserUtil {

    /**
     * Trích xuất văn bản từ file CV (hỗ trợ .pdf và .docx)
     * Tuân thủ UC04 - CareerFit Master SRS v2.0
     *
     * @param file File CV tải lên từ MultipartFile
     * @return Chuỗi văn bản thuần túy được trích xuất
     */
    public String extractTextFromCv(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Tệp tải lên không được để trống.");
        }

        String originalFilename = file.getOriginalFilename();
        if (originalFilename == null) {
            throw new IllegalArgumentException("Tên tệp không hợp lệ.");
        }

        String lowerFilename = originalFilename.toLowerCase();
        try {
            byte[] fileBytes = file.getBytes();
            String extractedText = "";

            if (lowerFilename.endsWith(".pdf")) {
                extractedText = extractTextFromPdf(fileBytes);
            } else if (lowerFilename.endsWith(".docx")) {
                extractedText = extractTextFromDocx(fileBytes);
            } else {
                throw new IllegalArgumentException("Hệ thống chỉ hỗ trợ định dạng tệp .pdf hoặc .docx.");
            }

            return normalizeExtractedText(extractedText);
        } catch (IllegalArgumentException e) {
            throw e;
        } catch (Exception e) {
            log.error("Lỗi khi trích xuất nội dung từ file [{}]: {}", originalFilename, e.getMessage(), e);
            throw new RuntimeException("Không thể đọc nội dung văn bản từ tệp CV: " + e.getMessage(), e);
        }
    }

    private String extractTextFromPdf(byte[] pdfBytes) throws Exception {
        try (PDDocument document = Loader.loadPDF(pdfBytes)) {
            PDFTextStripper stripper = new PDFTextStripper();
            stripper.setSortByPosition(true);
            String text = stripper.getText(document);
            String cleanText = (text != null) ? text.trim() : "";

            // Nếu trích xuất được văn bản rõ ràng (>= 30 ký tự), trả về kết quả
            if (cleanText.length() >= 30) {
                return cleanText;
            }

            // Trường hợp file PDF scan, in qua máy in ảo hoặc tệp hình ảnh không nhúng font:
            // Trích xuất metadata từ Document Information nếu có (tiêu đề, tác giả, từ khóa)
            StringBuilder metaSb = new StringBuilder();
            if (document.getDocumentInformation() != null) {
                var info = document.getDocumentInformation();
                if (info.getTitle() != null && !info.getTitle().isBlank()) {
                    metaSb.append("Tiêu đề tài liệu: ").append(info.getTitle()).append("\n");
                }
                if (info.getSubject() != null && !info.getSubject().isBlank()) {
                    metaSb.append("Chủ đề: ").append(info.getSubject()).append("\n");
                }
                if (info.getAuthor() != null && !info.getAuthor().isBlank()) {
                    metaSb.append("Tác giả: ").append(info.getAuthor()).append("\n");
                }
                if (info.getKeywords() != null && !info.getKeywords().isBlank()) {
                    metaSb.append("Từ khóa: ").append(info.getKeywords()).append("\n");
                }
            }

            String metaText = metaSb.toString().trim();
            if (!metaText.isEmpty()) {
                return cleanText.isEmpty() ? metaText : (metaText + "\n\n" + cleanText);
            }
            return cleanText;
        }
    }

    private String extractTextFromDocx(byte[] docxBytes) throws Exception {
        try (InputStream is = new ByteArrayInputStream(docxBytes);
             XWPFDocument doc = new XWPFDocument(is);
             XWPFWordExtractor extractor = new XWPFWordExtractor(doc)) {
            return extractor.getText();
        }
    }

    /**
     * Chuẩn hóa văn bản: gộp khoảng trắng thừa, xóa dòng trống liên tiếp
     */
    private String normalizeExtractedText(String text) {
        if (text == null) return "";
        return text.replaceAll("\u0000", "")
                   .replaceAll("[\\r\\n]{3,}", "\n\n")
                   .trim();
    }
}
