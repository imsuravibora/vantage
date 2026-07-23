import { jsPDF } from "jspdf";
import type { ReportRow } from "@/lib/reports";

type Segment = { text: string; bold: boolean };
type Block = { text: string; bullet: boolean };

function toBlocks(content: string): Block[] {
  return content
    .split(/\n+/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .map((line) => {
      const bullet = /^[*-]\s+/.test(line);
      return { text: line.replace(/^[*-]\s+/, ""), bullet };
    });
}

function toSegments(text: string): Segment[] {
  const parts = text.split(/(\*\*[^*]+\*\*)/g).filter(Boolean);
  return parts.map((part) => {
    const boldMatch = part.match(/^\*\*([^*]+)\*\*$/);
    return boldMatch ? { text: boldMatch[1], bold: true } : { text: part, bold: false };
  });
}

export function downloadReportPdf(report: ReportRow) {
  const doc = new jsPDF({ unit: "pt", format: "letter" });
  const marginX = 56;
  const maxX = doc.internal.pageSize.getWidth() - marginX;
  const pageBottom = doc.internal.pageSize.getHeight() - 56;
  const lineHeight = 16;
  let cursorY = 64;

  function ensureSpace() {
    if (cursorY > pageBottom) {
      doc.addPage();
      cursorY = 64;
    }
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text(report.title, marginX, cursorY);
  cursorY += 22;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`Generated ${new Date(report.created_at).toLocaleString()}`, marginX, cursorY);
  cursorY += 14;
  if (report.status !== "pending-review" && report.reviewed_by) {
    doc.text(
      `${report.status === "approved" ? "Approved" : "Rejected"} by ${report.reviewed_by}` +
        (report.reviewed_at ? ` on ${new Date(report.reviewed_at).toLocaleString()}` : ""),
      marginX,
      cursorY
    );
    cursorY += 14;
  }
  doc.setTextColor(0);
  cursorY += 10;

  const content = report.final_content ?? report.draft_content;
  const blocks = toBlocks(content);

  doc.setFontSize(11);
  for (const block of blocks) {
    ensureSpace();
    const indent = block.bullet ? 16 : 0;
    let cursorX = marginX + indent;

    if (block.bullet) {
      doc.setFont("helvetica", "normal");
      doc.text("•", marginX + 4, cursorY);
    }

    const segments = toSegments(block.text);
    for (const segment of segments) {
      doc.setFont("helvetica", segment.bold ? "bold" : "normal");
      const words = segment.text.split(/(\s+)/);
      for (const word of words) {
        if (word === "") continue;
        const wordWidth = doc.getTextWidth(word);
        if (cursorX + wordWidth > maxX && word.trim() !== "") {
          cursorY += lineHeight;
          ensureSpace();
          cursorX = marginX + indent;
        }
        doc.text(word, cursorX, cursorY);
        cursorX += wordWidth;
      }
    }
    cursorY += lineHeight + 6;
  }

  const filenameSafe = report.title.replace(/[^a-z0-9]+/gi, "-").toLowerCase();
  doc.save(`${filenameSafe}.pdf`);
}
