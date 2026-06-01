import { useNavigate } from 'react-router-dom';
import { NavList } from '../../components/NavList/NavList';

export default function BookingScreen() {
  const navigate = useNavigate();

  return (
    <NavList
      header="Запись на приём"
      onBack={() => navigate(-1)}
      items={[
        {
          key: 'new',
          icon: '📅',
          title: 'Записаться',
          subtitle: 'Выбор услуги и даты',
          onClick: () => navigate('/booking/new'),
        },
        {
          key: 'requests',
          icon: '📋',
          title: 'Мои заявки',
          subtitle: 'Статус ваших записей',
          onClick: () => navigate('/booking/requests'),
        },
      ]}
    />
  );
}
