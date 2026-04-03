import { useNavigate } from 'react-router-dom';
import { NavList } from '../components/NavList/NavList';

export default function GroomingScreen() {
  const navigate = useNavigate();

  return (
    <NavList
      header="Груминг"
      onBack={() => navigate(-1)}
      items={[
        {
          key: 'breeds',
          icon: '🐕',
          title: 'Услуги и породы',
          subtitle: 'Цены, описание, время',
          onClick: () => navigate('/grooming/breeds'),
        },
        {
          key: 'schedule',
          icon: '🗓',
          title: 'График работы',
          subtitle: 'Рабочие дни и часы кабинета',
          onClick: () => navigate('/grooming/schedule'),
        },
      ]}
    />
  );
}
