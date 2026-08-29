import { useEffect, useRef, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Box, Button, CircularProgress, FormControlLabel, Grid, Paper,
  Stack, Switch, TextField, Typography,
} from '@mui/material';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import ImageIcon from '@mui/icons-material/Image';
import { Layout } from '../../shared/ui/Layout';
import { useNotification } from '../../shared/ui/Notification/NotificationContext';
import {
  getClinicInfo, updateClinicInfo, uploadClinicLogo, uploadClinicBanner,
} from '../../data/source/clinic_info';
import type { ClinicInfoInput } from '../../data/source/clinic_info';
import { prepareImageForUpload, prepareLogoForUpload } from '../../shared/lib/prepareImageForUpload';

const BASE_URL = import.meta.env.VITE_API_URL ?? '';

/** Слот логотипа в шапке Mini App (AppHeader.module.css) */
const MINI_APP_LOGO_SIZE = 36;
const MINI_APP_LOGO_RADIUS = 8;
const LOGO_PREVIEW_SCALE = 3;

const EMPTY: ClinicInfoInput = {
  name: '', description: '', phone: '', address: '', email: '', website: '',
  banner_enabled: false,
};

export function ClinicInfoScreen() {
  const { notify } = useNotification();
  const queryClient = useQueryClient();

  const [form, setForm] = useState<ClinicInfoInput>(EMPTY);
  const [isDirty, setIsDirty] = useState(false);

  const logoInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['clinic-info'],
    queryFn: getClinicInfo,
  });

  useEffect(() => {
    if (data) {
      setForm({
        name: data.name,
        description: data.description,
        phone: data.phone,
        address: data.address,
        email: data.email,
        website: data.website,
        banner_enabled: data.banner_enabled,
      });
      setIsDirty(false);
    }
  }, [data]);

  const saveMutation = useMutation({
    mutationFn: () => updateClinicInfo(form),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clinic-info'] });
      setIsDirty(false);
      notify('Сохранено', 'success');
    },
    onError: () => notify('Ошибка сохранения', 'error'),
  });

  const logoMutation = useMutation({
    mutationFn: (file: File) => uploadClinicLogo(file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clinic-info'] });
      setLogoPreview(null);
      notify('Логотип обновлён', 'success');
    },
    onError: () => notify('Ошибка загрузки логотипа', 'error'),
  });

  const bannerMutation = useMutation({
    mutationFn: (file: File) => uploadClinicBanner(file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clinic-info'] });
      setBannerPreview(null);
      notify('Баннер обновлён', 'success');
    },
    onError: () => notify('Ошибка загрузки баннера', 'error'),
  });

  const handleField = (field: keyof ClinicInfoInput) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setForm((f) => ({ ...f, [field]: value }));
    setIsDirty(true);
  };

  const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    try {
      const prepared = await prepareLogoForUpload(file);
      setLogoPreview(URL.createObjectURL(prepared));
      logoMutation.mutate(prepared);
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Не удалось обработать изображение', 'error');
    }
  };

  const handleBannerChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    try {
      const prepared = await prepareImageForUpload(file);
      setBannerPreview(URL.createObjectURL(prepared));
      bannerMutation.mutate(prepared);
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Не удалось обработать изображение', 'error');
    }
  };

  const logoSrc = logoPreview ?? (data?.logo_url ? `${BASE_URL}${data.logo_url}` : undefined);
  const bannerSrc = bannerPreview ?? (data?.banner_url ? `${BASE_URL}${data.banner_url}` : undefined);

  if (isLoading) {
    return (
      <Layout title="О клинике">
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      </Layout>
    );
  }

  return (
    <Layout title="О клинике">
      <Typography variant="h5" fontWeight={600} mb={3}>О клинике</Typography>

      <Grid container spacing={3}>
        {/* ── Основная информация ── */}
        <Grid size={{ xs: 12, md: 7 }}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="subtitle1" fontWeight={600} mb={2}>Основная информация</Typography>
            <Stack spacing={2}>
              <TextField
                label="Название клиники"
                fullWidth
                value={form.name}
                onChange={handleField('name')}
              />
              <TextField
                label="Описание"
                fullWidth
                multiline
                rows={4}
                value={form.description}
                onChange={handleField('description')}
              />
              <TextField
                label="Телефон"
                fullWidth
                placeholder="+7 (999) 123-45-67"
                value={form.phone}
                onChange={handleField('phone')}
              />
              <TextField
                label="Адрес"
                fullWidth
                value={form.address}
                onChange={handleField('address')}
              />
              <TextField
                label="Email"
                fullWidth
                type="email"
                value={form.email}
                onChange={handleField('email')}
              />
              <TextField
                label="Сайт"
                fullWidth
                placeholder="https://"
                value={form.website}
                onChange={handleField('website')}
              />
            </Stack>
            <Box sx={{ mt: 3 }}>
              <Button
                variant="contained"
                onClick={() => saveMutation.mutate()}
                disabled={saveMutation.isPending || !isDirty}
              >
                {saveMutation.isPending ? 'Сохранение…' : 'Сохранить'}
              </Button>
            </Box>
          </Paper>
        </Grid>

        {/* ── Изображения ── */}
        <Grid size={{ xs: 12, md: 5 }}>
          <Stack spacing={3}>
            {/* Логотип */}
            <Paper sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant="subtitle1" fontWeight={600} mb={2}>Логотип</Typography>
              <Box
                sx={{
                  width: MINI_APP_LOGO_SIZE * LOGO_PREVIEW_SCALE,
                  height: MINI_APP_LOGO_SIZE * LOGO_PREVIEW_SCALE,
                  mx: 'auto',
                  mb: 2,
                  borderRadius: `${MINI_APP_LOGO_RADIUS * LOGO_PREVIEW_SCALE}px`,
                  bgcolor: 'grey.100',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                }}
              >
                {logoSrc ? (
                  <Box
                    component="img"
                    src={logoSrc}
                    alt=""
                    sx={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'contain',
                    }}
                  />
                ) : (
                  <PhotoCameraIcon sx={{ fontSize: 40, color: 'grey.400' }} />
                )}
              </Box>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/heic,image/heif,.heic,.heif"
                ref={logoInputRef}
                style={{ display: 'none' }}
                onChange={handleLogoChange}
              />
              <Button
                variant="outlined"
                size="small"
                startIcon={<PhotoCameraIcon />}
                onClick={() => logoInputRef.current?.click()}
                disabled={logoMutation.isPending}
              >
                {logoMutation.isPending ? 'Загрузка…' : 'Загрузить логотип'}
              </Button>
              <Typography variant="caption" display="block" color="text.secondary" mt={1}>
                JPG, PNG, WebP · до 5 МБ. Шапка Mini App / PWA и иконка вкладки браузера.
                Иконка на домашнем экране PWA задаётся при установке и из админки не меняется.
              </Typography>
            </Paper>

            {/* Баннер */}
            <Paper sx={{ p: 3 }}>
              <Stack direction="row" alignItems="center" justifyContent="space-between" mb={2}>
                <Typography variant="subtitle1" fontWeight={600}>Баннер на главной</Typography>
                <FormControlLabel
                  control={
                    <Switch
                      checked={form.banner_enabled}
                      onChange={handleField('banner_enabled')}
                      color="primary"
                    />
                  }
                  label={form.banner_enabled ? 'Включён' : 'Выключен'}
                />
              </Stack>
              <Typography variant="body2" color="text.secondary" mb={2}>
                Показывается в Mini App под шапкой. Сохраните форму, чтобы применить переключатель.
              </Typography>
              {bannerSrc ? (
                <Box
                  component="img"
                  src={bannerSrc}
                  sx={{ width: '100%', borderRadius: 1, mb: 2, objectFit: 'cover', maxHeight: 160 }}
                />
              ) : (
                <Box
                  sx={{
                    width: '100%', height: 120, mb: 2, borderRadius: 1,
                    bgcolor: 'grey.100', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}
                >
                  <ImageIcon sx={{ fontSize: 40, color: 'grey.400' }} />
                </Box>
              )}
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/heic,image/heif,.heic,.heif"
                ref={bannerInputRef}
                style={{ display: 'none' }}
                onChange={handleBannerChange}
              />
              <Button
                variant="outlined"
                size="small"
                startIcon={<ImageIcon />}
                onClick={() => bannerInputRef.current?.click()}
                disabled={bannerMutation.isPending}
              >
                {bannerMutation.isPending ? 'Загрузка…' : 'Загрузить баннер'}
              </Button>
              <Typography variant="caption" display="block" color="text.secondary" mt={1}>
                Рекомендуемое соотношение 16:9 · до 5 МБ
              </Typography>
            </Paper>
          </Stack>
        </Grid>
      </Grid>
    </Layout>
  );
}
