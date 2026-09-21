import { isRemoteDatabase } from "@/db/client";
import { getPhotosDir } from "@/lib/runtime-env";
import { PhotoStorage } from "./PhotoStorage";
import { SqlPhotoStorage } from "./SqlPhotoStorage";

export type PhotoStore = Pick<PhotoStorage, "save" | "read">;

const globalForPhotos = globalThis as typeof globalThis & {
  photoStore?: PhotoStore;
};

export function getPhotoStore(): PhotoStore {
  if (!globalForPhotos.photoStore) {
    globalForPhotos.photoStore = isRemoteDatabase()
      ? new SqlPhotoStorage()
      : new PhotoStorage(getPhotosDir());
  }
  return globalForPhotos.photoStore;
}
