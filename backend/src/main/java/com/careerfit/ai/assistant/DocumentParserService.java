package com.careerfit.ai.assistant;

import lombok.extern.slf4j.Slf4j;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xwpf.usermodel.*;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.InputStream;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

/**
 * Service trích xuất nội dung văn bản từ các tệp đính kèm: PDF, Word (DOCX) và Excel (XLSX, XLS).
 * Sử dụng Apache PDFBox và Apache POI thuần Java.
 */
@Slf4j
@Service
public class DocumentParserService {

    private static final int MAX_EXTRACTED_CHARS = 35000;

    public String extractText(MultipartFile file) throws Exception {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Tệp tải lên không được để trống.");
        }

        String originalFilename = file.getOriginalFilename();
        if (originalFilename == null) {
            originalFilename = "";
        }
        String ext = getFileExtension(originalFilename).toLowerCase(Locale.ROOT);

        log.info("Bắt đầu trích xuất văn bản từ tệp: {} (định dạng: {}, kích thước: {} bytes)",
                originalFilename, ext, file.getSize());

        String rawText;
        try (InputStream is = file.getInputStream()) {
            switch (ext) {
                case "pdf" -> rawText = extractFromPdf(is);
                case "docx" -> rawText = extractFromDocx(is);
                case "xlsx", "xls" -> rawText = extractFromExcel(is);
                default -> throw new IllegalArgumentException(
                        "Định dạng tệp không được hỗ trợ: ." + ext + ". Vui lòng đính kèm tệp .pdf, .docx hoặc .xlsx/.xls");
            }
        }

        if (rawText == null || rawText.trim().isBlank()) {
            throw new IllegalStateException("Không thể đọc được nội dung văn bản từ tệp " + originalFilename + ". Tệp có thể rỗng hoặc ở dạng ảnh scan.");
        }

        String cleaned = rawText.trim();
        if (cleaned.length() > MAX_EXTRACTED_CHARS) {
            log.warn("Nội dung tệp vượt quá {} ký tự, tự động cắt ngắn để tối ưu token AI.", MAX_EXTRACTED_CHARS);
            cleaned = cleaned.substring(0, MAX_EXTRACTED_CHARS);
        }

        log.info("Trích xuất thành công {} ký tự từ tệp {}", cleaned.length(), originalFilename);
        return cleaned;
    }

    private String extractFromPdf(InputStream is) throws Exception {
        try (PDDocument document = Loader.loadPDF(is.readAllBytes())) {
            PDFTextStripper stripper = new PDFTextStripper();
            stripper.setSortByPosition(true);
            return stripper.getText(document);
        }
    }

    private String extractFromDocx(InputStream is) throws Exception {
        try (XWPFDocument document = new XWPFDocument(is)) {
            StringBuilder sb = new StringBuilder();

            // Đọc các đoạn văn (paragraphs)
            for (XWPFParagraph p : document.getParagraphs()) {
                String text = p.getText();
                if (text != null && !text.isBlank()) {
                    sb.append(text.trim()).append("\n");
                }
            }

            // Đọc các bảng biểu (tables)
            for (XWPFTable table : document.getTables()) {
                for (XWPFTableRow row : table.getRows()) {
                    List<String> cells = new ArrayList<>();
                    for (XWPFTableCell cell : row.getTableCells()) {
                        String cellText = cell.getText();
                        if (cellText != null && !cellText.isBlank()) {
                            cells.add(cellText.trim());
                        }
                    }
                    if (!cells.isEmpty()) {
                        sb.append(String.join(" | ", cells)).append("\n");
                    }
                }
            }

            return sb.toString();
        }
    }

    private String extractFromExcel(InputStream is) throws Exception {
        try (Workbook workbook = WorkbookFactory.create(is)) {
            StringBuilder sb = new StringBuilder();
            DataFormatter formatter = new DataFormatter();

            int sheetCount = workbook.getNumberOfSheets();
            for (int s = 0; s < sheetCount; s++) {
                Sheet sheet = workbook.getSheetAt(s);
                sb.append("\n--- Bảng tính: ").append(sheet.getSheetName()).append(" ---\n");

                for (Row row : sheet) {
                    List<String> rowCells = new ArrayList<>();
                    for (Cell cell : row) {
                        String val = formatter.formatCellValue(cell);
                        if (val != null && !val.isBlank()) {
                            rowCells.add(val.trim());
                        }
                    }
                    if (!rowCells.isEmpty()) {
                        sb.append(String.join(" | ", rowCells)).append("\n");
                    }
                }
            }
            return sb.toString();
        }
    }

    private String getFileExtension(String filename) {
        int idx = filename.lastIndexOf('.');
        return (idx > 0 && idx < filename.length() - 1) ? filename.substring(idx + 1) : "";
    }
}
