import { BrowserRouter, Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useRef } from 'react';
import AppLayout from './components/AppLayout/AppLayout';
import HomeScreen from './screens/HomeScreen';
import AnimalsScreen from './screens/AnimalsScreen';
import CategoriesScreen from './screens/CategoriesScreen';
import ArticlesScreen from './screens/ArticlesScreen';
import ArticleScreen from './screens/ArticleScreen';
import DoctorsScreen from './screens/DoctorsScreen';
import DoctorScreen from './screens/DoctorScreen';
import ScheduleScreen from './screens/ScheduleScreen';
import { GroomingGuard } from './components/GroomingGuard/GroomingGuard';
import GroomingScreen from './screens/GroomingScreen';
import GroomingBreedsScreen from './screens/GroomingBreedsScreen';
import GroomingScheduleScreen from './screens/GroomingScheduleScreen';
import TelegramOnlyScreen from './screens/TelegramOnlyScreen';

function BackButtonHandler() {
  const navigate = useNavigate();
  const location = useLocation();
  const navigateRef = useRef(navigate);

  useEffect(() => {
    navigateRef.current = navigate;
  }, [navigate]);

  // Регистрируем обработчик один раз — стабильная ссылка через ref
  useEffect(() => {
    const tg = window.Telegram?.WebApp;
    if (!tg) return;
    const handleBack = () => navigateRef.current(-1);
    tg.BackButton.onClick(handleBack);
    return () => tg.BackButton.offClick(handleBack);
  }, []);

  // Показываем/скрываем кнопку при смене роута
  useEffect(() => {
    const tg = window.Telegram?.WebApp;
    if (!tg) return;
    const isRoot = location.pathname === '/';
    if (isRoot) {
      tg.BackButton.hide();
    } else {
      tg.BackButton.show();
    }
    // После сворачивания/разворачивания Telegram сбрасывает состояние BackButton —
    // переподписываемся на activated чтобы восстановить видимость
    const onActivated = () => {
      if (!isRoot) tg.BackButton.show();
    };
    tg.onEvent('activated', onActivated);
    return () => tg.offEvent('activated', onActivated);
  }, [location.pathname]);

  return null;
}

export default function App() {
  const isInsideTelegram =
    Boolean(window.Telegram?.WebApp) ||
    window.location.hash.includes('tgWebApp') ||
    window.location.search.includes('tgWebApp');

  if (!isInsideTelegram) return <TelegramOnlyScreen />;

  return (
    <BrowserRouter>
      <BackButtonHandler />
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<HomeScreen />} />
          <Route path="/animals" element={<AnimalsScreen />} />
          <Route path="/animals/:animalSlug/categories" element={<CategoriesScreen />} />
          <Route path="/animals/:animalSlug/categories/:categorySlug/articles" element={<ArticlesScreen />} />
          <Route path="/articles/:articleSlug" element={<ArticleScreen />} />
          <Route path="/doctors" element={<DoctorsScreen />} />
          <Route path="/doctors/:doctorId" element={<DoctorScreen />} />
          <Route path="/schedule" element={<ScheduleScreen />} />
          <Route element={<GroomingGuard />}>
            <Route path="/grooming" element={<GroomingScreen />} />
            <Route path="/grooming/breeds" element={<GroomingBreedsScreen />} />
            <Route path="/grooming/schedule" element={<GroomingScheduleScreen />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
