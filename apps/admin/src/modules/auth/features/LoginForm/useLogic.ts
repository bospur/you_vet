import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { valibotResolver } from '@hookform/resolvers/valibot';
import * as v from 'valibot';
import { useNavigate } from 'react-router-dom';
import { isAxiosError } from 'axios';
import { loginRequest } from '../../../../data/source/auth';
import type { AuthUserResponse } from '../../../../data/source/auth';
import { useAuth } from '../../../../shared/config/AuthContext';
import { useNotification } from '../../../../shared/ui/Notification/NotificationContext';
import type { LoginFormValues } from '../../domain/types';
import {
  loadRememberedLogin,
  loadRememberPreference,
  saveRememberLogin,
} from '../../domain/rememberLogin';

const schema = v.object({
  login: v.pipe(v.string(), v.minLength(1, 'Введите логин')),
  password: v.pipe(v.string(), v.minLength(1, 'Введите пароль')),
  rememberMe: v.boolean(),
});

function homePathForRole(role: AuthUserResponse['role']): string {
  switch (role) {
    case 'manager':
      return '/booking';
    case 'groomer':
      return '/grooming';
    case 'admin':
      return '/dashboard';
    default:
      return '/animals';
  }
}

export function useLoginFormLogic() {
  const { establishSession } = useAuth();
  const { notify } = useNotification();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const form = useForm<LoginFormValues>({
    resolver: valibotResolver(schema),
    defaultValues: {
      login: loadRememberedLogin(),
      password: '',
      rememberMe: loadRememberPreference() || Boolean(loadRememberedLogin()),
    },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    setLoading(true);
    try {
      const { user } = await loginRequest({
        login: values.login,
        password: values.password,
        remember_me: values.rememberMe,
      });
      saveRememberLogin(values.login, values.rememberMe);
      establishSession(user);
      notify('Вход выполнен', 'success');
      navigate(homePathForRole(user.role));
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
