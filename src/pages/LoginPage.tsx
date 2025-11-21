import LoginForm from '@/components/LoginForm';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/useAuth';

const LoginPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) navigate('/');
  }, [user]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-md p-6 bg-card rounded-lg shadow">
        <h2 className="text-center text-2xl font-semibold mb-4">Iniciar sesión</h2>
        <LoginForm />
      </div>
    </div>
  );
};

export default LoginPage;
