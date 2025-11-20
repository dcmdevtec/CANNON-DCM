import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const LoginForm = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  async function onSubmit(e?: React.FormEvent) {
    e?.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      toast({ title: 'Bienvenido', description: 'Has iniciado sesión correctamente' });
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'No se pudo iniciar sesión', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-4">
      <div>
        <label className="block text-sm mb-1">Correo</label>
        <Input value={email} onChange={e => setEmail(e.target.value)} placeholder="tu@correo.com" />
      </div>

      <div>
        <label className="block text-sm mb-1">Contraseña</label>
        <Input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Contraseña" />
      </div>

      <div className="flex items-center justify-between gap-2">
        <Button type="submit" className="flex-1 flex items-center justify-center" disabled={loading}>
          {loading ? (
            <span className="inline-flex items-center gap-2">
              <svg className="h-4 w-4 animate-spin text-primary-foreground" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
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

export default LoginForm;
