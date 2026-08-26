import type { ReactNode } from "react";

export interface IconProps {
  size?: number;
}

export function Icon({ children, size = 18 }: IconProps & { children: ReactNode }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {children}
    </svg>
  );
}

export const CheckIcon = ({ size }: IconProps) => <Icon size={size}><path d="m5 12 4 4L19 6" /></Icon>;
export const PlusIcon = ({ size }: IconProps) => <Icon size={size}><path d="M12 5v14M5 12h14" /></Icon>;
export const SparkIcon = ({ size }: IconProps) => <Icon size={size}><path d="m12 3-1.5 5.5L5 10l5.5 1.5L12 17l1.5-5.5L19 10l-5.5-1.5L12 3Z" /><path d="m19 16-.6 2.4L16 19l2.4.6L19 22l.6-2.4L22 19l-2.4-.6L19 16Z" /></Icon>;
export const CalendarIcon = ({ size }: IconProps) => <Icon size={size}><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M16 3v4M8 3v4M3 10h18" /></Icon>;
export const ArrowIcon = ({ size }: IconProps) => <Icon size={size}><path d="M5 12h14M13 6l6 6-6 6" /></Icon>;
export const MoonIcon = ({ size }: IconProps) => <Icon size={size}><path d="M20.5 14.5A8.5 8.5 0 0 1 9.5 3.5a8.5 8.5 0 1 0 11 11Z" /></Icon>;
export const SunIcon = ({ size }: IconProps) => <Icon size={size}><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></Icon>;
export const AlertIcon = ({ size }: IconProps) => <Icon size={size}><path d="M12 4 3 20h18L12 4Z" /><path d="M12 10v4M12 17h.01" /></Icon>;
export const CloseIcon = ({ size }: IconProps) => <Icon size={size}><path d="m6 6 12 12M18 6 6 18" /></Icon>;
export const EyeIcon = ({ size }: IconProps) => <Icon size={size}><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z" /><circle cx="12" cy="12" r="3" /></Icon>;
export const EyeOffIcon = ({ size }: IconProps) => <Icon size={size}><path d="M17.94 17.94A10.94 10.94 0 0 1 12 19c-7 0-11-7-11-7 1.5-2.5 4.2-4.6 7.5-5.6" /><path d="M1 1l22 22" /></Icon>;
export const ShieldIcon = ({ size }: IconProps) => <Icon size={size}><path d="M12 3 4.5 6v5c0 4.8 3.1 8.2 7.5 10 4.4-1.8 7.5-5.2 7.5-10V6L12 3Z" /><path d="m9 12 2 2 4-4" /></Icon>;
export const LogoutIcon = ({ size }: IconProps) => <Icon size={size}><path d="M10 17l5-5-5-5M15 12H3M21 19V5a2 2 0 0 0-2-2h-5" /></Icon>;
export const FlagIcon = ({ size }: IconProps) => <Icon size={size}><path d="M5 21V4M5 5c4-3 6 3 14 0v9c-8 3-10-3-14 0" /></Icon>;
export const ClockIcon = ({ size }: IconProps) => <Icon size={size}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></Icon>;
export const EditIcon = ({ size }: IconProps) => <Icon size={size}><path d="m4 16-.8 4.8L8 20l11.5-11.5a2.1 2.1 0 0 0-3-3L5 17Z" /><path d="m14.5 7.5 3 3" /></Icon>;
export const TrashIcon = ({ size }: IconProps) => <Icon size={size}><path d="M4 7h16M10 11v6M14 11v6M6 7l1 14h10l1-14M9 7V4h6v3" /></Icon>;
export const RefreshIcon = ({ size }: IconProps) => <Icon size={size}><path d="M20 11a8 8 0 0 0-14.8-4L3 10" /><path d="M3 5v5h5M4 13a8 8 0 0 0 14.8 4L21 14" /><path d="M21 19v-5h-5" /></Icon>;
export const MenuIcon = ({ size }: IconProps) => <Icon size={size}><path d="M4 6h16M4 12h16M4 18h16" /></Icon>;
