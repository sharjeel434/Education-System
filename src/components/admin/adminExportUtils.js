function csvCell(value) {
  if (value === null || value === undefined) {
    return '""';
  }

  if (typeof value === "number") {
    return Number.isFinite(value) ? `"${String(value)}"` : '""';
  }

  if (typeof value !== "string" && typeof value !== "boolean") {
    return '""';
  }

  let text = String(value);
  if (/^(?:\uFEFF|[ \t\r\n])*[=+\-@]/.test(text)) {
    text = `'${text}`;
  }

  return `"${text.replaceAll('"', '""')}"`;
}

export function createCsvContent(rows, columns) {
  if (!Array.isArray(rows) || !Array.isArray(columns) || columns.length === 0) {
    throw new Error("CSV export requires rows and at least one column.");
  }

  const headers = columns.map((column) => {
    if (!column || typeof column.header !== "string" || typeof column.getValue !== "function") {
      throw new Error("CSV export column definitions are invalid.");
    }
    return csvCell(column.header);
  });

  const records = rows.map((row) =>
    columns.map((column) => csvCell(column.getValue(row))).join(","),
  );

  return `\uFEFF${[headers.join(","), ...records].join("\r\n")}`;
}

export function downloadCsv(filename, content) {
  if (typeof filename !== "string" || !filename.trim() || typeof content !== "string") {
    throw new Error("CSV download details are invalid.");
  }

  if (
    typeof window.URL?.createObjectURL !== "function" ||
    typeof window.Blob !== "function"
  ) {
    throw new Error("CSV downloads are not supported by this browser.");
  }

  const blob = new Blob([content], { type: "text/csv;charset=utf-8" });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");

  try {
    link.href = url;
    link.download = filename;
    link.hidden = true;
    document.body.append(link);
    link.click();
  } catch (error) {
    window.URL.revokeObjectURL(url);
    throw error;
  } finally {
    link.remove();
  }

  window.setTimeout(() => window.URL.revokeObjectURL(url), 1000);
}
