import { Outlet, useLocation, useOutletContext } from 'react-router-dom';
import type { ClinicInfo } from '@you-vet/types';
import { InstallBanner } from '../InstallBanner';
import { RootAppBar } from './AppBar';
import { TabBar } from './TabBar';
import { TopBar } from './TopBar';
import { TAB_ROOTS } from './nav';
import styles from './AppShell.module.css';

export type ClinicOutletContext = ClinicInfo | null;

export function AppShell() {
  const location = useLocation();
  const info = useOutletContext<ClinicOutletContext>();
  const isTabRoot = TAB_ROOTS.has(location.pathname);
  const hideTabBar =
    location.pathname.startsWith('/auth') ||
    location.pathname.startsWith('/booking/new') ||
    location.pathname.startsWith('/chats/');

  return (
    <div className={styles.root}>
      <TopBar info={info ?? null} />
      <div className={styles.column}>
        {isTabRoot && <RootAppBar info={info ?? null} />}
        <main className={hideTabBar ? styles.mainNoTab : styles.main}>
          <div className={styles.content}>
            <InstallBanner />
            <Outlet context={info} />
          </div>
        </main>
        {!hideTabBar && <TabBar />}
      </div>
    </div>
  );
}
