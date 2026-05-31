import { Navigate } from 'react-router-dom';
import { Box } from '@mui/material';
import { LoginForm } from '../../modules/auth/features/LoginForm';
import { useAuth } from '../../shared/config/AuthContext';
import { Loader } from '../../shared/ui/Loader';

export function LoginScreen() {
  const { user, loading } = useAuth();

  if (loading) return <Loader />;
  if (user) return <Navigate to="/dashboard" replace />;

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'background.default',
      }}
    >
      <LoginForm />
    </Box>
  );
}
