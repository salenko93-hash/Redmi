/** Browser-only preparation shared by PDF export and the dedicated print view. */
export async function waitForReportAssets(root: HTMLElement) {
  await document.fonts.ready;
  await Promise.all(
    Array.from(root.querySelectorAll("img"))
      .filter((img) => !img.closest("dialog"))
      .map(async (img) => {
        img.loading = "eager";
        await img.decode();
      }),
  );
}

async function svgImage(svg: SVGSVGElement): Promise<HTMLImageElement> {
  const clone = svg.cloneNode(true) as SVGSVGElement;
  const viewBox = svg.viewBox.baseVal;
  const width = viewBox.width || 600,
    height = viewBox.height || 350;
  clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  clone.setAttribute("width", String(width));
  clone.setAttribute("height", String(height));
  clone.removeAttribute("class");
  clone.removeAttribute("style");
  const sourceTexts = svg.querySelectorAll("text");
  clone.querySelectorAll("text").forEach((text, i) => {
    const style = getComputedStyle(sourceTexts[i]);
    text.style.fontFamily = "Arial, sans-serif";
    text.style.fontSize = style.fontSize;
    text.style.fontWeight = style.fontWeight;
    text.style.fill = style.fill;
  });
  const url = URL.createObjectURL(
    new Blob([new XMLSerializer().serializeToString(clone)], {
      type: "image/svg+xml;charset=utf-8",
    }),
  );
  try {
    const image = new Image();
    image.src = url;
    await image.decode();
    const canvas = document.createElement("canvas");
    canvas.width = Math.ceil(width * 3);
    canvas.height = Math.ceil(height * 3);
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Браузер не підтримує підготовку рисунків.");
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    const result = document.createElement("img");
    result.src = canvas.toDataURL("image/png");
    result.alt = svg.getAttribute("aria-label") ?? "Рисунок до звіту";
    result.dataset.pdfmake = JSON.stringify({
      fit: [480, 330],
      margin: [0, 8, 0, 10],
    });
    return result;
  } finally {
    URL.revokeObjectURL(url);
  }
}

export async function reportHtml(root: HTMLElement) {
  const clone = root.cloneNode(true) as HTMLElement;
  clone
    .querySelectorAll(
      "dialog, button, .no-print, .graph-selects, .force-fields, [role=group]",
    )
    .forEach((element) => element.remove());
  const originalSvgs = Array.from(
    root.querySelectorAll<SVGSVGElement>("svg"),
  ).filter((svg) => !svg.closest("dialog, button, .no-print, [role=group]"));
  const clonedSvgs = Array.from(clone.querySelectorAll<SVGSVGElement>("svg"));
  for (let i = 0; i < clonedSvgs.length; i++)
    clonedSvgs[i].replaceWith(await svgImage(originalSvgs[i]));
  for (const image of Array.from(clone.querySelectorAll("img"))) {
    if (!image.src.startsWith("data:")) {
      const loaded = new Image();
      loaded.src = image.src;
      await loaded.decode();
      const canvas = document.createElement("canvas");
      canvas.width = loaded.naturalWidth;
      canvas.height = loaded.naturalHeight;
      const context = canvas.getContext("2d");
      if (!context) throw new Error("Не вдалося підготувати рисунок.");
      context.drawImage(loaded, 0, 0);
      image.src = canvas.toDataURL("image/png");
      image.dataset.pdfmake = JSON.stringify({ fit: [480, 330] });
    }
  }
  clone.querySelectorAll("details").forEach((details) => {
    const div = document.createElement("div");
    div.append(...details.childNodes);
    details.replaceWith(div);
  });
  clone.querySelectorAll("summary, figcaption").forEach((element) => {
    const p = document.createElement("p");
    p.append(...element.childNodes);
    element.replaceWith(p);
  });
  clone.querySelectorAll("h1,h2,h3,h4").forEach((element) => {
    (element as HTMLElement).dataset.pdfmake = JSON.stringify({
      headlineLevel: Number(element.tagName.slice(1)),
    });
  });
  clone.querySelectorAll("table").forEach((table) => {
    table.dataset.pdfmake = JSON.stringify({
      widths: Array.from(table.rows[0]?.cells ?? [], () => "*"),
      headerRows: 1,
      layout: "lightHorizontalLines",
      dontBreakRows: false,
    });
  });
  clone.querySelectorAll<HTMLElement>("[class], [style]").forEach((element) => {
    element.removeAttribute("class");
    element.removeAttribute("style");
  });
  return clone.innerHTML;
}

export async function downloadReportPdf(
  root: HTMLElement,
  title: string,
  filename: string,
) {
  const [pdfModule, fontModule, htmlModule, html] = await Promise.all([
    import("pdfmake/build/pdfmake"),
    import("pdfmake/build/vfs_fonts"),
    import("html-to-pdfmake"),
    reportHtml(root),
  ]);
  const pdfMake = pdfModule.default;
  // pdfmake 0.2.20 exports the font dictionary directly; older type declarations wrap it in `vfs`.
  const fontExport = fontModule.default as unknown as Record<string, string> & {
    vfs?: Record<string, string>;
  };
  pdfMake.vfs = fontExport.vfs ?? fontExport;
  const content = htmlModule.default(html, {
    defaultStyles: {
      h1: { fontSize: 19, bold: true, marginBottom: 12 },
      h2: { fontSize: 15, bold: true, marginTop: 14, marginBottom: 8 },
      h3: { fontSize: 12, bold: true, marginTop: 10, marginBottom: 5 },
      h4: { fontSize: 11, bold: true, marginTop: 8 },
      p: { marginBottom: 7 },
      table: { marginBottom: 12 },
      th: { bold: true, fillColor: "#edf1ed" },
      td: { margin: [3, 4, 3, 4] },
    },
  });
  const document = pdfMake.createPdf({
    pageSize: "A4",
    pageMargins: [42, 40, 42, 40],
    content,
    defaultStyle: { font: "Roboto", fontSize: 10, lineHeight: 1.25 },
    info: { title, author: "ФізЛаб" },
    footer: (page, pages) => ({
      text: `ФізЛаб · ${page} / ${pages}`,
      alignment: "center",
      fontSize: 8,
      color: "#5a665e",
      margin: [0, 12, 0, 0],
    }),
    pageBreakBefore: (node, following) =>
      Boolean(node.headlineLevel && following.length === 0),
  });
  const blob = await new Promise<Blob>((resolve) => document.getBlob(resolve));
  const url = URL.createObjectURL(blob);
  const link = window.document.createElement("a");
  link.href = url;
  link.download = filename;
  window.document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60000);
}
