import { ValidationError } from "@/domain/errors";
import { getSqlClient } from "@/db/client";

const MAX_BYTES = 512 * 1024;

/** Stores visitor photos in Turso so they survive Vercel redeploys. */
export class SqlPhotoStorage {
  async save(visitId: string, dataUrl: string): Promise<string> {
    if (!dataUrl.startsWith("data:image/")) {
      throw new ValidationError("Photo must be a JPEG image.");
    }

    const [, encoded] = dataUrl.split(",", 2);
    if (!encoded) {
      throw new ValidationError("Photo data is invalid.");
    }

    const buffer = Buffer.from(encoded, "base64");
    if (buffer.length > MAX_BYTES) {
      throw new ValidationError("Photo is too large. Try again closer to the camera.");
    }

    const client = await getSqlClient();
    await client.execute({
      sql: `
        INSERT INTO photos (id, data, content_type)
        VALUES (?, ?, 'image/jpeg')
        ON CONFLICT(id) DO UPDATE SET
          data = excluded.data,
          content_type = excluded.content_type
      `,
      args: [visitId, buffer],
    });
    return `/api/photos/${visitId}`;
  }

  async read(visitId: string): Promise<Buffer | null> {
    const client = await getSqlClient();
    const result = await client.execute({
      sql: "SELECT data FROM photos WHERE id = ? LIMIT 1",
      args: [visitId],
    });
    const row = result.rows[0] as { data?: Uint8Array | Buffer } | undefined;
    if (!row?.data) return null;
    return Buffer.from(row.data);
  }
}
