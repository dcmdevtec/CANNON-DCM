import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Eye, EyeOff } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const LoginNewForm = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const { toast } = useToast();
    const navigate = useNavigate();

    async function onSubmit(e?: React.FormEvent) {
        e?.preventDefault();
        setLoading(true);
        try {
            const response = await fetch('https://erpweb.cannonapps.com:4101/apigateway/auth//authentication/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    UserName: email,
                    Password: password,
                }),
            });

            if (response.ok) {
                // Create a dummy user session object
                const customUser = {
                    id: 'custom-user-id',
                    email: email,
                    user_metadata: {
                        full_name: email
                    },
                    app_metadata: {
                        provider: 'custom_api'
                    },
                    aud: 'authenticated',
                    created_at: new Date().toISOString()
                };

                localStorage.setItem('custom_user', JSON.stringify(customUser));

                // Dispatch a storage event to notify other tabs/components if they listen to it
                // But mainly we rely on useAuth hook update or page reload/navigation
                window.dispatchEvent(new Event('storage'));

                toast({ title: 'Bienvenido', description: 'Has iniciado sesión correctamente' });
                navigate('/');
                // Force a reload to ensure useAuth picks up the change if it doesn't automatically
                // or rely on the navigation to trigger a re-render where useAuth checks localStorage
                window.location.reload();
            } else {
                throw new Error('Credenciales inválidas');
            }

        } catch (err: any) {
            toast({ title: 'Error', description: err.message || 'No se pudo iniciar sesión', variant: 'destructive' });
        } finally {
            setLoading(false);
        }
    }

    return (
        <form onSubmit={onSubmit} className="grid gap-5">
            <div>
                <label className="block text-sm font-medium mb-2">Usuario</label>
                <Input
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="Usuario"
                    className="bg-slate-50 border border-slate-200"
                />
            </div>

            <div>
                <label className="block text-sm font-medium mb-2">Contraseña</label>
                <div className="relative">
                    <Input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        placeholder="Contraseña"
                        className="pr-10 bg-slate-50 border border-slate-200"
                    />
                    <button
                        type="button"
                        aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                        onClick={() => setShowPassword(v => !v)}
                        className="absolute inset-y-0 right-3 flex items-center text-slate-700 focus:outline-none"
                    >
                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                </div>
            </div>

            <div className="pt-2">
                <Button
                    type="submit"
                    className="w-full bg-gradient-to-r from-primary/90 to-accent/90 text-white shadow-md hover:opacity-95"
                    disabled={loading}
                >
                    {loading ? (
                        <span className="inline-flex items-center justify-center gap-2">
                            <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                            </svg>
                            Iniciando...
                        </span>
                    ) : (
                        'Iniciar sesión'
                    )}
                </Button>
            </div>
        </form>
    );
};

export default LoginNewForm;
