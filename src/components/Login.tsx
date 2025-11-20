import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const Login = ({ children }: { children?: React.ReactNode }) => {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  async function onSubmitEmail(e?: React.FormEvent) {
    e?.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      toast({ title: 'Bienvenido', description: 'Login exitoso' });
      setOpen(false);
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'No se pudo iniciar sesión', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }

  async function onSendMagicLink(e?: React.FormEvent) {
    e?.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({ email });
      if (error) throw error;
      toast({ title: 'Revisa tu correo', description: 'Te enviamos un enlace mágico para iniciar sesión' });
      setOpen(false);
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'No se pudo enviar el enlace', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children ?? <Button variant="default">Iniciar sesión</Button>}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Iniciar sesión</DialogTitle>
          <DialogDescription>
            Accede a tu cuenta para continuar. Puedes usar contraseña o enlace mágico.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmitEmail} className="grid gap-4 py-4">
          <label className="text-sm">Correo</label>
          <Input value={email} onChange={e => setEmail(e.target.value)} placeholder="tu@correo.com" />

          <label className="text-sm">Contraseña</label>
          <Input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Contraseña" />

          <div className="flex items-center justify-between gap-2">
            <Button type="submit" variant="default" className="flex-1" disabled={loading}>
              Entrar
            </Button>
            <Button type="button" variant="ghost" onClick={onSendMagicLink} disabled={loading}>
              Enviar enlace
            </Button>
          </div>
        </form>

        <DialogFooter>
          <p className="text-sm text-muted-foreground">Si no tienes cuenta, regístrate desde Supabase o contacta al admin.</p>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default Login;
