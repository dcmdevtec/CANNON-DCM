import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Bell, AlertTriangle, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Link } from "react-router-dom";

type Notification = {
  id: number;
  message: string;
  type: string;
  severity: string;
  container_number: string;
};

const NotificationIcon = ({ severity }: { severity: string }) => {
  if (severity === 'warning') {
    return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
  }
  return <Info className="h-5 w-5 text-blue-500" />;
};

const Header = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    const fetchNotifications = async () => {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(10);

      if (error) {
        console.error("Error fetching notifications:", error);
      } else {
        setNotifications(data as Notification[]);
      }
    };

    fetchNotifications();
  }, []);

  return (
    <header className="h-16 flex items-center justify-end px-8 bg-white border-b">
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5" />
            {notifications.length > 0 && (
              <span className="absolute top-1 right-1 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
              </span>
            )}
            <span className="sr-only">Abrir notificaciones</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 mr-4">
          <div className="grid gap-4">
            <div className="space-y-2">
              <h4 className="font-medium leading-none">Notificaciones</h4>
              <p className="text-sm text-muted-foreground">
                Tienes {notifications.length} notificaciones recientes.
              </p>
            </div>
            <div className="grid gap-2">
              {notifications.map((notification) => (
                <Link
                  key={notification.id}
                  to={`/container/${notification.container_number}`}
                  className="flex items-start space-x-4 rounded-md p-2 transition-all hover:bg-accent"
                >
                  <NotificationIcon severity={notification.severity} />
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {notification.type}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {notification.message}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </header>
  );
};

export default Header;