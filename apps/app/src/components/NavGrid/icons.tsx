import firstAidIcon from '../../assets/menu/arcticles.svg';
import doctorsIcon from '../../assets/menu/doctors.svg';
import scheduleIcon from '../../assets/menu/sheldue.png';
import groomingIcon from '../../assets/menu/gruming.png';

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
