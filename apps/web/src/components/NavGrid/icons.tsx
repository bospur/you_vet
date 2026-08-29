import { createElement, type ComponentType, type ReactNode } from 'react';
import {
  FaCalendarDays,
  FaCalendarPlus,
  FaCircleQuestion,
  FaHeart,
  FaScissors,
  FaUserDoctor,
} from 'react-icons/fa6';
import type { IconType } from 'react-icons';

/** Как в mini app (`apps/app/.../NavGrid/icons.tsx`), размер под карточки mobile */
const NAV_ICON_SIZE = 40;

type NavReactIconProps = {
  size?: number;
  color?: string;
  'aria-hidden'?: boolean;
};

function asNavIcon(icon: IconType): ComponentType<NavReactIconProps> {
  return icon as ComponentType<NavReactIconProps>;
}

const HeartIcon = asNavIcon(FaHeart);
const UserDoctorIcon = asNavIcon(FaUserDoctor);
const CalendarDaysIcon = asNavIcon(FaCalendarDays);
const CalendarPlusIcon = asNavIcon(FaCalendarPlus);
const ScissorsIcon = asNavIcon(FaScissors);
const CircleQuestionIcon = asNavIcon(FaCircleQuestion);

function NavFaIcon({ icon }: { icon: ComponentType<NavReactIconProps> }): ReactNode {
  return createElement(icon, {
    size: NAV_ICON_SIZE,
    color: 'currentColor',
    'aria-hidden': true,
  }) as ReactNode;
}

export function IconFirstAid(): ReactNode {
  return NavFaIcon({ icon: HeartIcon });
}

export function IconDoctors(): ReactNode {
  return NavFaIcon({ icon: UserDoctorIcon });
}

export function IconSchedule(): ReactNode {
  return NavFaIcon({ icon: CalendarDaysIcon });
}

export function IconBooking(): ReactNode {
  return NavFaIcon({ icon: CalendarPlusIcon });
}

export function IconGrooming(): ReactNode {
  return NavFaIcon({ icon: ScissorsIcon });
}

export function IconQuestion(): ReactNode {
  return NavFaIcon({ icon: CircleQuestionIcon });
}
