import { VisitRecord } from "@/domain/Visit";

export class VisitCsvExporter {
  export(rows: VisitRecord[]): string {
    const headers = [
      "Name",
      "Phone",
      "Campus",
      "Purpose",
      "Host",
      "Vehicle reg",
      "Source",
      "Signed in",
      "Signed out",
      "Duration",
      "Status",
    ];
    const lines = [headers.join(",")];
    for (const row of rows) {
      const duration = row.signedOutAt
        ? `${Math.round((new Date(row.signedOutAt).getTime() - new Date(row.signedInAt).getTime()) / 60000)} min`
        : "On site";
      const values = [
        row.name,
        row.phone,
        row.campus,
        row.purpose,
        row.host,
        row.vehicleReg ?? "",
        row.source,
        row.signedInAt,
        row.signedOutAt ?? "",
        duration,
        row.signedOutAt ? "Left" : "On site",
      ];
      lines.push(values.map((value) => this.cell(value)).join(","));
    }
    return lines.join("\n");
  }

  private cell(value: string): string {
    return `"${value.replace(/"/g, '""')}"`;
  }
}
