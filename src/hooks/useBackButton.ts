import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

export function useBackButton() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const tg = window.Telegram?.WebApp;
    if (!tg) return;

    const isRoot = location.pathname === '/';

    if (isRoot) {
      tg.BackButton.hide();
    } else {
      tg.BackButton.show();
    }

    const handleBack = () => navigate(-1);
    tg.BackButton.onClick(handleBack);

    return () => {
      tg.BackButton.offClick(handleBack);
    };
  }, [location.pathname, navigate]);
}
