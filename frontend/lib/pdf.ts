export type PdfExportOptions = {
  filename?: string;
  title?: string;
  landscape?: boolean;
};

function labToRgb(value: string): string | null {
  const match = value.match(/^\s*([\d.]+)(%?)\s+([+-]?[\d.]+)(%?)\s+([+-]?[\d.]+)(%?)(?:\s*\/\s*([\d.]+)(%?)\s*)?$/);
  if (!match) return null;

  const lightness = Number(match[1]) * (match[2] === "%" ? 1 : 1);
  const axisA = Number(match[3]) * (match[4] === "%" ? 1.25 : 1);
  const axisB = Number(match[5]) * (match[6] === "%" ? 1.25 : 1);
  const alpha = match[7] == null ? 1 : Number(match[7]) / (match[8] === "%" ? 100 : 1);
  const fy = (lightness + 16) / 116;
  const fx = fy + axisA / 500;
  const fz = fy - axisB / 200;
  const inverse = (channel: number) => channel ** 3 > 216 / 24389
    ? channel ** 3
    : (116 * channel - 16) / (24389 / 27);

  const x50 = 0.96422 * inverse(fx);
  const y50 = inverse(fy);
  const z50 = 0.82521 * inverse(fz);
  const x = 0.9555766 * x50 - 0.0230393 * y50 + 0.0631636 * z50;
  const y = -0.0282895 * x50 + 1.0099416 * y50 + 0.0210077 * z50;
  const z = 0.0122982 * x50 - 0.020483 * y50 + 1.3299098 * z50;
  const encode = (channel: number) => {
    const linear = Math.max(0, Math.min(1, channel));
    return Math.round(255 * (linear <= 0.0031308 ? 12.92 * linear : 1.055 * linear ** (1 / 2.4) - 0.055));
  };

  return `rgba(${encode(3.2404542 * x - 1.5371385 * y - 0.4985314 * z)}, ${encode(-0.969266 * x + 1.8760108 * y + 0.041556 * z)}, ${encode(0.0556434 * x - 0.2040259 * y + 1.0572252 * z)}, ${Math.max(0, Math.min(1, alpha))})`;
}

function normalizeLabColors(document: Document) {
  const elements = [document.documentElement, ...Array.from(document.body.querySelectorAll<HTMLElement>("*"))];
  for (const element of elements) {
    const view = document.defaultView;
    if (!view) continue;
    const computed = view.getComputedStyle(element);
    for (let index = 0; index < computed.length; index += 1) {
      const property = computed.item(index);
      const value = computed.getPropertyValue(property);
      if (!/lab\(/i.test(value)) continue;
      const normalized = value.replace(/lab\(([^()]*)\)/gi, (color, channels: string) => {
        return labToRgb(channels) ?? color;
      });
      if (normalized !== value) element.style.setProperty(property, normalized, "important");
    }
  }
}

export async function exportElementToPdf(element: HTMLElement | null, options: PdfExportOptions = {}) {
  if (!element) throw new Error("Nothing to export");

  const html2canvasMod = await import("html2canvas");
  const jsPdfMod = await import("jspdf");
  const html2canvas = html2canvasMod.default ?? html2canvasMod;
  const { jsPDF } = jsPdfMod;

  const canvas = await html2canvas(element, {
    scale: 2,
    backgroundColor: "#ffffff",
    onclone: (clonedDocument) => normalizeLabColors(clonedDocument),
  });
  const imgData = canvas.toDataURL("image/png");

  const orientation = (options.landscape ?? true) ? "landscape" : "portrait";
  const pdf = new jsPDF({ orientation, unit: "pt", format: "a4" });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();

  const ratio = Math.min(pageWidth / canvas.width, pageHeight / canvas.height);
  const imgWidth = canvas.width * ratio;
  const imgHeight = canvas.height * ratio;
  const margin = 24;
  let y = margin;

  if (options.title) {
    pdf.setFontSize(14);
    pdf.text(options.title, pageWidth / 2, margin, { align: "center" });
    y += 20;
  }

  const x = (pageWidth - imgWidth) / 2;
  pdf.addImage(imgData, "PNG", x, y, imgWidth, imgHeight);
  pdf.save(options.filename || "schedule.pdf");
}
