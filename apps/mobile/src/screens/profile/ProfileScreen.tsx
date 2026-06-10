import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { API_URL } from '../../api/client';
import {
  fetchProfile,
  updateProfile,
  uploadProfilePhoto,
  type MobileProfile,
} from '../../api/profile';
import { useAuth } from '../../auth/AuthContext';
import { setTokens } from '../../auth/tokenStorage';
import { authMethodLabel, maskPhone } from '../../auth/mobileUser';
import { NestedAppBar } from '../../components/shell/AppBar';
import { Preloader } from '../../components/Preloader';
import { prepareImageForUpload } from '../../lib/prepareImageForUpload';
import { getApiErrorMessage } from '../../utils/apiError';
import styles from './ProfileScreen.module.css';

function ProfileContent({ profile }: { profile: MobileProfile }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { refreshAuthState } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [displayName, setDisplayName] = useState(profile.display_name);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [photoError, setPhotoError] = useState<string | null>(null);

  const saveMutation = useMutation({
    mutationFn: () => updateProfile(displayName.trim()),
    onSuccess: async (result) => {
      if (result.tokens) {
        await setTokens(result.tokens.access_token, result.tokens.refresh_token);
        await refreshAuthState();
      }
      queryClient.setQueryData(['mobile-profile'], result.profile);
      setSaveMessage('Сохранено');
      setTimeout(() => setSaveMessage(null), 2500);
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

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const name = displayName.trim();
    if (name.length < 1 || name.length > 100) return;
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
      <NestedAppBar title="Личный кабинет" onBack={() => navigate('/more')} />
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
        {photoError && <p className={styles.error}>{photoError}</p>}

        <form className={styles.form} onSubmit={handleSubmit}>
          <label className={styles.label} htmlFor="display-name">
            Имя
          </label>
          <input
            id="display-name"
            className={styles.input}
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            maxLength={100}
            placeholder="Как к вам обращаться"
          />

          <button
            type="submit"
            className={styles.primaryBtn}
            disabled={saveMutation.isPending || displayName.trim().length < 1}
          >
            {saveMutation.isPending ? 'Сохранение…' : 'Сохранить'}
          </button>
          {saveMutation.isError && (
            <p className={styles.error}>
              {getApiErrorMessage(saveMutation.error, 'Не удалось сохранить')}
            </p>
          )}
          {saveMessage && <p className={styles.success}>{saveMessage}</p>}
        </form>

        <section className={styles.info}>
          <h3 className={styles.infoTitle}>Данные аккаунта</h3>
          {profile.phone && (
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Телефон</span>
              <span>{maskPhone(profile.phone)}</span>
            </div>
          )}
          <div className={styles.infoRow}>
            <span className={styles.infoLabel}>Способ входа</span>
            <span>
              {authMethodLabel({
                id: profile.id,
                name: profile.display_name || null,
                phone: profile.phone || null,
                vkId: profile.vk_user_id ?? null,
                telegramUserId: profile.telegram_user_id ?? null,
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
      </div>
    </>
  );
}

export default function ProfileScreen() {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/auth/login?return=/profile', { replace: true });
    }
  }, [authLoading, isAuthenticated, navigate]);

  const { data: profile, isLoading, isError } = useQuery({
    queryKey: ['mobile-profile'],
    queryFn: fetchProfile,
    enabled: isAuthenticated,
  });

  if (authLoading || !isAuthenticated) return null;

  if (isLoading) return <Preloader />;

  if (isError || !profile) {
    return (
      <>
        <NestedAppBar title="Личный кабинет" />
        <div className={styles.wrap}>
          <p className={styles.muted}>Не удалось загрузить профиль</p>
          <button type="button" className={styles.secondaryBtn} onClick={() => navigate('/more')}>
            Назад
          </button>
        </div>
      </>
    );
  }

  return <ProfileContent profile={profile} />;
}
