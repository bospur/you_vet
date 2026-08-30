import { useNavigate } from 'react-router-dom';
import { NestedAppBar } from '../../components/shell/AppBar';
import { NavList } from '../../components/NavList';

export default function GroomingScreen() {
  const navigate = useNavigate();

  return (
    <>
      <NestedAppBar title="Груминг" />
      <NavList
        items={[
          {
            key: 'book',
            icon: '📅',
            title: 'Записаться',
            subtitle: 'Выбор услуги, даты и слота',
            onClick: () => navigate('/grooming/book'),
          },
          {
            key: 'mine',
            icon: '📋',
            title: 'Мои записи',
            subtitle: 'Статус заявок на груминг',
            onClick: () => navigate('/grooming/requests'),
          },
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
        onBack={() => navigate('/')}
      />
    </>
  );
}
