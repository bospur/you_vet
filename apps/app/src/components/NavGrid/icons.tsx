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

/** Размер иконок в сетке «Полезное» (см. NavGrid.module.css `.icon svg`) */
const NAV_ICON_SIZE = 64;

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

/** Статьи — сердце (как в прежней иконке раздела) */
export function IconFirstAid(): ReactNode {
  return NavFaIcon({ icon: HeartIcon });
}

/** Наши врачи */
export function IconDoctors(): ReactNode {
  return NavFaIcon({ icon: UserDoctorIcon });
}

/** Расписание */
export function IconSchedule(): ReactNode {
  return NavFaIcon({ icon: CalendarDaysIcon });
}

/** Запись на приём */
export function IconBooking(): ReactNode {
  return NavFaIcon({ icon: CalendarPlusIcon });
}

/** Груминг */
export function IconGrooming(): ReactNode {
  return NavFaIcon({ icon: ScissorsIcon });
}

/** Задать вопрос */
export function IconQuestion(): ReactNode {
  return NavFaIcon({ icon: CircleQuestionIcon });
}
