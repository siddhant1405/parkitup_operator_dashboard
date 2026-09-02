import {
  Building2,
  Home,
  Landmark,
  MoreHorizontal,
  ParkingSquare,
  Store,
  type LucideIcon,
} from "lucide-react"

import type { parkingTypeValues } from "@/features/sites/schemas/site"

export const parkingTypeIcons: Record<
  (typeof parkingTypeValues)[number],
  LucideIcon
> = {
  residential: Home,
  society: Home,
  commercial: Store,
  corporate: Building2,
  mcd: Landmark,
  standalone: ParkingSquare,
  "free-parking": ParkingSquare,
  other: MoreHorizontal,
}
