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
  Home,
  Coffee,
  Gift,
  Briefcase,
  Book,
  Bus,
  TrainFront,
  Fuel,
  Phone,
  Wifi,
  Tv,
  Music,
  Gamepad2,
  PawPrint,
  Baby,
  Wrench,
  Scissors,
  Umbrella,
  type LucideIcon,
} from 'lucide-react-native';

export type BuiltInCategory = { key: string; label: string };

export const BUILT_IN_CATEGORIES: BuiltInCategory[] = [
  { key: 'groceries', label: 'Groceries' },
  { key: 'dining', label: 'Dining' },
  { key: 'transport', label: 'Transport' },
  { key: 'shopping', label: 'Shopping' },
  { key: 'bills', label: 'Bills' },
  { key: 'entertainment', label: 'Entertainment' },
  { key: 'health', label: 'Health' },
  { key: 'income', label: 'Income' },
  { key: 'education', label: 'Education' },
  { key: 'travel', label: 'Travel' },
  { key: 'fitness', label: 'Fitness' },
];

export const COLOR_SWATCHES: string[] = [
  '#2FB872', '#FF6B5E', '#2BB3FF', '#7C5CFC',
  '#F5A623', '#FF5CA8', '#18BFA8', '#16A34A',
  '#3B82F6', '#06B6D4', '#8B5CF6', '#8A8F86',
];

export const ICON_OPTIONS: { key: string; Icon: LucideIcon }[] = [
  { key: 'shopping-cart', Icon: ShoppingCart },
  { key: 'utensils', Icon: Utensils },
  { key: 'car', Icon: Car },
  { key: 'shopping-bag', Icon: ShoppingBag },
  { key: 'receipt', Icon: Receipt },
  { key: 'film', Icon: Film },
  { key: 'heart-pulse', Icon: HeartPulse },
  { key: 'graduation-cap', Icon: GraduationCap },
  { key: 'plane', Icon: Plane },
  { key: 'dumbbell', Icon: Dumbbell },
  { key: 'arrow-up-right', Icon: ArrowUpRight },
  { key: 'tag', Icon: Tag },
  { key: 'home', Icon: Home },
  { key: 'coffee', Icon: Coffee },
  { key: 'gift', Icon: Gift },
  { key: 'briefcase', Icon: Briefcase },
  { key: 'book', Icon: Book },
  { key: 'bus', Icon: Bus },
  { key: 'train-front', Icon: TrainFront },
  { key: 'fuel', Icon: Fuel },
  { key: 'phone', Icon: Phone },
  { key: 'wifi', Icon: Wifi },
  { key: 'tv', Icon: Tv },
  { key: 'music', Icon: Music },
  { key: 'gamepad-2', Icon: Gamepad2 },
  { key: 'paw-print', Icon: PawPrint },
  { key: 'baby', Icon: Baby },
  { key: 'wrench', Icon: Wrench },
  { key: 'scissors', Icon: Scissors },
  { key: 'umbrella', Icon: Umbrella },
];

export function getIconByKey(key: string): LucideIcon {
  return ICON_OPTIONS.find((option) => option.key === key)?.Icon ?? Tag;
}

export function withAlpha(hex: string, alpha: string = '1A'): string {
  return `${hex}${alpha}`;
}
