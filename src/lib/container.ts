import { LibsqlVisitRepository } from "@/repositories/LibsqlVisitRepository";
import { LibsqlWatchlistRepository } from "@/repositories/LibsqlWatchlistRepository";
import { PhotoStorage } from "@/services/PhotoStorage";
import { VisitService } from "@/services/VisitService";
import { getPhotosDir } from "./runtime-env";

const globalForApp = globalThis as typeof globalThis & {
  photoStorage?: PhotoStorage;
};

export function getPhotoStorage(): PhotoStorage {
  if (!globalForApp.photoStorage) {
    globalForApp.photoStorage = new PhotoStorage(getPhotosDir());
  }
  return globalForApp.photoStorage;
}

export function getWatchlistRepository(): LibsqlWatchlistRepository {
  return new LibsqlWatchlistRepository();
}

export function getVisitService(): VisitService {
  return new VisitService(
    new LibsqlVisitRepository(),
    getPhotoStorage(),
    getWatchlistRepository(),
  );
}
