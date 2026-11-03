/**
 * Small browser download helpers used by settings and admin exports.
 */

export const downloadFile = (filename, content, type) => {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");

  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();

  URL.revokeObjectURL(url);
};

export const downloadJson = (filename, data) => {
  downloadFile(filename, JSON.stringify(data, null, 2), "application/json");
};

export const downloadCsv = (filename, rows) => {
  const csv = rows
    .map((row) =>
      row
        .map((cell) => `"${String(cell ?? "").replace(/"/g, '""')}"`)
        .join(",")
    )
    .join("\r\n");

  downloadFile(filename, csv, "text/csv;charset=utf-8;");
};
