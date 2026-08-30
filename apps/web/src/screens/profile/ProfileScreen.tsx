import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { API_URL } from '../../api/client';
import {
  updateProfile,
  uploadProfilePhoto,
  type MobileProfile,
} from '../../api/profile';
import { useAuth } from '../../auth/AuthContext';
import { setTokens } from '../../auth/tokenStorage';
import { APP_ROLE_LABELS, authMethodLabel, maskPhone, normalizeAppRole } from '../../auth/mobileUser';
import { NestedAppBar } from '../../components/shell/AppBar';
import { Preloader } from '../../components/Preloader';
import { ProgressBar } from '../../components/ProgressBar';
import { prepareImageForUpload } from '../../lib/prepareImageForUpload';
import { useTheme } from '../../theme/ThemeContext';
import { useMobileProfile } from '../../hooks/useMobileProfile';
import { getApiErrorMessage } from '../../utils/apiError';
import styles from './ProfileScreen.module.css';

function ProfileContent({ profile }: { profile: MobileProfile }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { refreshAuthState, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [displayName, setDisplayName] = useState(profile.display_name);
  const [photoError, setPhotoError] = useState<string | null>(null);

  const savedName = profile.display_name.trim();
  const trimmedName = displayName.trim();
  const isNameDirty = trimmedName !== savedName;
  const canSaveName = isNameDirty && trimmedName.length >= 1 && trimmedName.length <= 100;

  const saveMutation = useMutation({
    mutationFn: () => updateProfile(trimmedName),
    onSuccess: async (result) => {
      if (result.tokens) {
        await setTokens(result.tokens.access_token, result.tokens.refresh_token);
        await refreshAuthState();
      }
      queryClient.setQueryData(['mobile-profile'], result.profile);
      setDisplayName(result.profile.display_name);
    },
  });

  const photoMutation = useMutation({
    mutationFn: async (file: File) => {
      const prepared = await prepareImageForUpload(file);
      return uploadProfilePhoto(prepared);
    },
    onSuccess: (updated) => {
      queryClient.setQueryData(['mobile-profile'], updated);
      setPhotoError(null);
    },
    onError: (err: unknown) => {
      setPhotoError(getApiErrorMessage(err, 'Не удалось загрузить фото'));
    },
  });

  const handleNameSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!canSaveName || saveMutation.isPending) return;
    saveMutation.mutate();
  };

  const handlePhotoPick = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setPhotoError(null);
    photoMutation.mutate(file);
  };

  const photoSrc = profile.photo_url ? `${API_URL}${profile.photo_url}` : null;
  const initial = (profile.display_name || '?').charAt(0).toUpperCase();

  return (
    <>
      <NestedAppBar title="Личный кабинет" />
      <div className={styles.wrap}>
        <button
          type="button"
          className={styles.avatarBtn}
          onClick={() => fileInputRef.current?.click()}
          disabled={photoMutation.isPending}
        >
          {photoSrc ? (
            <img src={photoSrc} alt="" className={styles.avatarImg} />
          ) : (
            <span className={styles.avatarFallback}>{initial}</span>
          )}
          <span className={styles.avatarHint}>
            {photoMutation.isPending ? 'Загрузка…' : 'Изменить фото'}
          </span>
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className={styles.hiddenInput}
          onChange={handlePhotoPick}
        />
        {photoMutation.isPending && (
          <ProgressBar label="Загружаем фото…" />
        )}
        {photoError && <p className={styles.error}>{photoError}</p>}

        <form className={styles.form} onSubmit={handleNameSubmit}>
          <label className={styles.label} htmlFor="display-name">
            Имя
          </label>
          <div className={styles.inputWrap}>
            <input
              id="display-name"
              className={styles.input}
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              maxLength={100}
              placeholder="Как к вам обращаться"
            />
            {isNameDirty && (
              <button
                type="submit"
                className={styles.inputAction}
                disabled={!canSaveName || saveMutation.isPending}
                aria-label="Сохранить имя"
                title="Сохранить"
              >
                {saveMutation.isPending ? '…' : '✓'}
              </button>
            )}
          </div>
          {saveMutation.isError && (
            <p className={styles.error}>
              {getApiErrorMessage(saveMutation.error, 'Не удалось сохранить')}
            </p>
          )}
        </form>

        <section className={styles.info}>
          <h3 className={styles.infoTitle}>Оформление</h3>
          <div className={styles.themeRow}>
            <span className={styles.infoLabel}>Тема</span>
            <div className={styles.themeToggle} role="group" aria-label="Тема оформления">
              <button
                type="button"
                className={theme === 'light' ? styles.themeBtnActive : styles.themeBtn}
                onClick={() => setTheme('light')}
              >
                Светлая
              </button>
              <button
                type="button"
                className={theme === 'dark' ? styles.themeBtnActive : styles.themeBtn}
                onClick={() => setTheme('dark')}
              >
                Тёмная
              </button>
            </div>
          </div>
        </section>

        <section className={styles.info}>
          <h3 className={styles.infoTitle}>Данные аккаунта</h3>
          <div className={styles.infoRow}>
            <span className={styles.infoLabel}>Роль</span>
            <span>{APP_ROLE_LABELS[normalizeAppRole(profile.app_role)]}</span>
          </div>
          {profile.phone && (
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Телефон</span>
              <span>{maskPhone(profile.phone)}</span>
            </div>
          )}
          {profile.email && (
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Почта</span>
              <span>{profile.email}</span>
            </div>
          )}
          <div className={styles.infoRow}>
            <span className={styles.infoLabel}>Способ входа</span>
            <span>
              {authMethodLabel({
                id: profile.id,
                name: profile.display_name || null,
                phone: profile.phone || null,
                email: profile.email || null,
                vkId: profile.vk_user_id ?? null,
                telegramUserId: profile.telegram_user_id ?? null,
                appRole: normalizeAppRole(profile.app_role),
              })}
            </span>
          </div>
          {profile.telegram_user_id ? (
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Telegram</span>
              <span className={styles.ok}>Привязан</span>
            </div>
          ) : (
            <button
              type="button"
              className={styles.linkBtn}
              onClick={() => navigate('/auth/link-telegram?return=/profile')}
            >
              Привязать Telegram
            </button>
          )}
          {profile.vk_user_id && (
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>VK ID</span>
              <span>{profile.vk_user_id}</span>
            </div>
          )}
        </section>

        <button
          type="button"
          className={styles.logoutBtn}
          onClick={async () => {
            await logout();
            queryClient.removeQueries({ queryKey: ['mobile-profile'] });
            navigate('/', { replace: true });
          }}
        >
          Выйти из аккаунта
        </button>
      </div>
    </>
  );
}

export default function ProfileScreen() {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading: authLoading, refreshAuthState } = useAuth();
  const { data: profile, isLoading, isError, isFetching, refetch } = useMobileProfile();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/auth/login?return=/profile', { replace: true });
    }
  }, [authLoading, isAuthenticated, navigate]);

  useEffect(() => {
    if (isError) {
      void refreshAuthState();
    }
  }, [isError, refreshAuthState]);

  const handleRetry = async () => {
    await refreshAuthState();
    await refetch();
  };

  if (authLoading || !isAuthenticated) return null;

  if (isLoading) return <Preloader />;

  if (isError || !profile) {
    return (
      <>
        <NestedAppBar title="Личный кабинет" />
        <div className={styles.wrap}>
          <p className={styles.muted}>Не удалось загрузить профиль</p>
          <button
            type="button"
            className={styles.secondaryBtn}
            onClick={() => void handleRetry()}
            disabled={isFetching}
          >
            {isFetching ? 'Загрузка…' : 'Повторить'}
          </button>
        </div>
      </>
    );
  }

  return <ProfileContent profile={profile} />;
}
