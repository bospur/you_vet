import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { valibotResolver } from '@hookform/resolvers/valibot';
import * as v from 'valibot';
import { useNavigate } from 'react-router-dom';
import { isAxiosError } from 'axios';
import { loginRequest } from '../../../../data/source/auth';
import { useAuth } from '../../../../shared/config/AuthContext';
import { useNotification } from '../../../../shared/ui/Notification/NotificationContext';
import type { LoginFormValues } from '../../domain/types';

const schema = v.object({
  login: v.pipe(v.string(), v.minLength(1, 'Введите логин')),
  password: v.pipe(v.string(), v.minLength(1, 'Введите пароль')),
});

export function useLoginFormLogic() {
  const { establishSession } = useAuth();
  const { notify } = useNotification();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const form = useForm<LoginFormValues>({
    resolver: valibotResolver(schema),
    defaultValues: { login: '', password: '' },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    setLoading(true);
    try {
      const { user } = await loginRequest(values);
      establishSession(user);
      notify('Вход выполнен', 'success');
      navigate('/dashboard');
    } catch (err) {
      if (isAxiosError(err)) {
        const status = err.response?.status;
        if (status === 401) {
          notify('Неверный логин или пароль', 'error');
        } else {
          notify('Ошибка сервера. Попробуйте позже', 'error');
        }
      } else {
        notify('Нет соединения с сервером', 'error');
      }
    } finally {
      setLoading(false);
    }
  });

  return { form, onSubmit, loading };
}
