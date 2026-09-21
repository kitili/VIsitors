import { LibsqlVisitRepository } from "@/repositories/LibsqlVisitRepository";
import { LibsqlWatchlistRepository } from "@/repositories/LibsqlWatchlistRepository";
import { SqliteVisitRepository } from "@/repositories/SqliteVisitRepository";
import { SqliteWatchlistRepository } from "@/repositories/SqliteWatchlistRepository";
import { WatchlistRepository } from "@/repositories/WatchlistRepository";
import { VisitRepository } from "@/repositories/VisitRepository";
import { PhotoStorage } from "@/services/PhotoStorage";
import { VisitService } from "@/services/VisitService";
import { getPhotosDir, isTursoEnabled } from "./runtime-env";

const globalForApp = globalThis as typeof globalThis & {
  photoStorage?: PhotoStorage;
};

function getVisitRepository(): VisitRepository {
  if (isTursoEnabled()) {
    return new LibsqlVisitRepository();
  }
  return new SqliteVisitRepository();
}

function getWatchlistRepository(): WatchlistRepository {
  if (isTursoEnabled()) {
    return new LibsqlWatchlistRepository();
  }
  return new SqliteWatchlistRepository();
}

export function getPhotoStorage(): PhotoStorage {
  if (!globalForApp.photoStorage) {
    globalForApp.photoStorage = new PhotoStorage(getPhotosDir());
  }
  return globalForApp.photoStorage;
}

export { getWatchlistRepository };

export function getVisitService(): VisitService {
  return new VisitService(getVisitRepository(), getPhotoStorage(), getWatchlistRepository());
}
