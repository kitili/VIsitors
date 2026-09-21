import { LibsqlVisitRepository } from "@/repositories/LibsqlVisitRepository";
import { LibsqlWatchlistRepository } from "@/repositories/LibsqlWatchlistRepository";
import { getPhotoStore } from "@/services/photo-storage";
import { VisitService } from "@/services/VisitService";

export function getPhotoStorage() {
  return getPhotoStore();
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
