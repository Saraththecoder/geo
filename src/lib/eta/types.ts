import { LatLng, EtaResult, IEtaProvider } from "@/types";

export type { LatLng, EtaResult, IEtaProvider };

export interface CachedEtaEntry {
  result: EtaResult;
  expiresAt: number;
}
