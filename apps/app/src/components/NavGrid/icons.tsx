import firstAidIcon from '../../assets/menu/arcticles.svg';
import doctorsIcon from '../../assets/menu/doctors.svg';
import scheduleIcon from '../../assets/menu/sheldue.svg';
import groomingIcon from '../../assets/menu/gruming.svg';

function MenuIcon({ src }: { src: string }) {
  return <img src={src} alt="" aria-hidden />;
}

export function IconFirstAid() {
  return <MenuIcon src={firstAidIcon} />;
}

export function IconDoctors() {
  return <MenuIcon src={doctorsIcon} />;
}

export function IconSchedule() {
  return <MenuIcon src={scheduleIcon} />;
}

export function IconGrooming() {
  return <MenuIcon src={groomingIcon} />;
}
