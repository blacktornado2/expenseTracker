import {
  ShoppingCart,
  Utensils,
  Car,
  ShoppingBag,
  Receipt,
  Film,
  HeartPulse,
  GraduationCap,
  Plane,
  Dumbbell,
  ArrowUpRight,
  Tag,
  type LucideIcon,
} from 'lucide-react-native';

export type CategoryMeta = {
  color: string;
  softBg: string;
  Icon: LucideIcon;
};

export const CATEGORY_META: Record<string, CategoryMeta> = {
  groceries: { color: '#2FB872', softBg: '#E6F6EE', Icon: ShoppingCart },
  dining: { color: '#FF6B5E', softBg: '#FFEDEA', Icon: Utensils },
  transport: { color: '#2BB3FF', softBg: '#E6F4FF', Icon: Car },
  shopping: { color: '#7C5CFC', softBg: '#EFEAFE', Icon: ShoppingBag },
  bills: { color: '#F5A623', softBg: '#FEF2DE', Icon: Receipt },
  entertainment: { color: '#FF5CA8', softBg: '#FFEAF3', Icon: Film },
  health: { color: '#18BFA8', softBg: '#E3F8F4', Icon: HeartPulse },
  income: { color: '#16A34A', softBg: '#E6F6EC', Icon: ArrowUpRight },
  education: { color: '#3B82F6', softBg: '#EFF6FF', Icon: GraduationCap },
  travel: { color: '#06B6D4', softBg: '#ECFEFF', Icon: Plane },
  fitness: { color: '#10B981', softBg: '#ECFDF5', Icon: Dumbbell },
};

const FALLBACK_PALETTE: CategoryMeta[] = [
  { color: '#9AA096', softBg: '#ECEBE6', Icon: Tag },
  { color: '#7C5CFC', softBg: '#EFEAFE', Icon: Tag },
  { color: '#F5A623', softBg: '#FEF2DE', Icon: Tag },
  { color: '#2BB3FF', softBg: '#E6F4FF', Icon: Tag },
];

function hashString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
  }
  return hash;
}

export function getCategoryMeta(category: string): CategoryMeta {
  const key = category.trim().toLowerCase();
  const known = CATEGORY_META[key];
  if (known) {
    return known;
  }
  const index = hashString(key) % FALLBACK_PALETTE.length;
  return FALLBACK_PALETTE[index];
}
