import LoginNewForm from '@/components/LoginNewForm';
import { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/lib/useAuth';

const LoginNewPage = () => {
    const { user, loading } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (!loading && user) navigate('/');
    }, [user, loading]);

    // while we know if user is logged in, don't render the page to avoid flicker
    if (loading) return null;

    return (
        <div className="min-h-screen grid grid-cols-1 md:grid-cols-2">
            <div className="hidden md:flex items-center justify-center bg-gradient-to-br from-primary/10 to-accent/5">
                <div className="p-12 text-center">
                    <img src="/logo-dark.png" alt="logo" className="mx-auto -mb-20 h-30 w-30 object-contain" />
                    <h3 className="text-3xl font-bold mb-2">Bienvenido a Cannon</h3>
                    <p className="text-muted-foreground max-w-sm mx-auto">Monitorea contenedores, recibe notificaciones y toma decisiones con datos en tiempo real.</p>
                </div>
            </div>

            <div className="flex items-center justify-center">
                <div className="w-full max-w-md p-10 bg-card rounded-2xl shadow-lg">
                    <div className="flex flex-col items-center mb-6">
                        <img src="/logo-dark.png" alt="logo" className="h-14 w-50  mb-2" />
                        <h2 className="text-xl font-semibold">Accede a tu cuenta (Nuevo)</h2>
                        <p className="text-sm text-muted-foreground">Introduce tus credenciales para continuar</p>
                    </div>
                    <LoginNewForm />
                    <div className="mt-4 text-center">
                        <Link to="/login" className="text-sm text-primary hover:underline">
                            Volver al login anterior
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LoginNewPage;
