import { Campus, CAMPUS_NAMES } from "@/domain/Campus";
import { ValidationError } from "@/domain/errors";
import { localDateKey } from "@/lib/date-key";
import { requireVisit, SignInInput, Visit, VisitRecord } from "@/domain/Visit";
import { VisitQuery, VisitRepository } from "@/repositories/VisitRepository";
import { WatchlistRepository } from "@/repositories/WatchlistRepository";
import { PhotoStorage } from "./PhotoStorage";

export type VisitStats = {
  total: number;
  onSite: number;
  selfCheckIns: number;
  deskCheckIns: number;
};

export type CampusOverview = {
  name: string;
  slug: string;
  accent: string;
  onSite: number;
  totalToday: number;
  selfToday: number;
  deskToday: number;
};

export type NetworkOverview = {
  date: string;
  totalOnSite: number;
  campuses: CampusOverview[];
};

export class VisitService {
  constructor(
    private readonly visits: VisitRepository,
    private readonly photos: PhotoStorage,
    private readonly watchlist?: WatchlistRepository,
  ) {}

  async signIn(input: SignInInput): Promise<VisitRecord> {
    const match = await this.watchlist?.match(input.name, input.phone);
    if (match) {
      throw new ValidationError(
        `This visitor is on the watchlist: ${match.reason}. Contact school leadership before allowing entry.`,
      );
    }

    let visit = Visit.signIn({ ...input, photo: null });
    if (input.source !== "self" && input.photo?.startsWith("data:image/")) {
      const photoPath = await this.photos.save(visit.id, input.photo);
      visit = visit.withPhoto(photoPath);
    }
    await this.visits.save(visit);
    return visit.toRecord();
  }

  async signOut(id: string): Promise<VisitRecord> {
    const visit = requireVisit(await this.visits.findById(id), id);
    const signedOut = visit.signOut();
    await this.visits.save(signedOut);
    return signedOut.toRecord();
  }

  async signOutByPhone(phone: string, campus?: string): Promise<VisitRecord> {
    const visit = requireVisit(
      await this.visits.findActiveByPhone(phone, campus),
      "active visit for this phone",
    );
    return this.signOut(visit.id);
  }

  async signOutAll(campus: string): Promise<number> {
    Campus.parse(campus);
    return this.visits.signOutAll(campus, localDateKey());
  }

  async lookupByPhone(phone: string): Promise<VisitRecord | null> {
    const visit = await this.visits.findLatestByPhone(phone);
    return visit?.toRecord() ?? null;
  }

  async list(filters: VisitQuery): Promise<VisitRecord[]> {
    if (filters.campus) {
      Campus.parse(filters.campus);
    }
    const visits = await this.visits.query(filters);
    return visits
      .sort((a, b) => b.signedInAt.getTime() - a.signedInAt.getTime())
      .map((visit) => visit.toRecord());
  }

  async stats(date: string, campus?: string): Promise<VisitStats> {
    const records = await this.list({ date, campus });
    return {
      total: records.length,
      onSite: records.filter((record) => !record.signedOutAt).length,
      selfCheckIns: records.filter((record) => record.source === "self").length,
      deskCheckIns: records.filter((record) => record.source === "desk").length,
    };
  }

  async networkOverview(date = localDateKey()): Promise<NetworkOverview> {
    const campuses = CAMPUS_NAMES.map((name) => {
      const campus = Campus.parse(name);
      return { name, slug: campus.slug, accent: campus.accent };
    });

    const campusStats = await Promise.all(
      campuses.map(async (campus) => {
        const records = await this.list({ campus: campus.name, date });
        return {
          ...campus,
          onSite: records.filter((record) => !record.signedOutAt).length,
          totalToday: records.length,
          selfToday: records.filter((record) => record.source === "self").length,
          deskToday: records.filter((record) => record.source === "desk").length,
        };
      }),
    );

    return {
      date,
      totalOnSite: campusStats.reduce((sum, campus) => sum + campus.onSite, 0),
      campuses: campusStats,
    };
  }
}
