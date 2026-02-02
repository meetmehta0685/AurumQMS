'use client';

import { useState, useEffect } from 'react';
import { Bell, Calendar, CheckCircle, Clock, AlertCircle, XCircle, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { createClient } from '@/lib/supabase/client';
import { format, formatDistanceToNow } from 'date-fns';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'appointment' | 'reminder' | 'status' | 'info';
  read: boolean;
  created_at: string;
  appointment_id?: string;
}

interface NotificationBellProps {
  userId: string;
  userRole: 'patient' | 'doctor' | 'admin';
}

export function NotificationBell({ userId, userRole }: NotificationBellProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const supabase = createClient();

  const fetchNotifications = async () => {
    try {
      // For now, we'll generate notifications based on appointments
      // In a real app, you'd have a notifications table
      
      const today = new Date().toISOString().split('T')[0];
      const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      
      const generatedNotifications: Notification[] = [];

      if (userRole === 'patient') {
        // Fetch today's appointments for reminders
        const { data: todayAppts } = await supabase
          .from('appointments')
          .select('id, appointment_date, appointment_time, status, doctor:doctors(profile:profiles!doctors_profile_id_fkey(full_name))')
          .eq('patient_id', userId)
          .eq('appointment_date', today)
          .in('status', ['pending', 'confirmed']);

        // Fetch tomorrow's appointments for reminders
        const { data: tomorrowAppts } = await supabase
          .from('appointments')
          .select('id, appointment_date, appointment_time, status, doctor:doctors(profile:profiles!doctors_profile_id_fkey(full_name))')
          .eq('patient_id', userId)
          .eq('appointment_date', tomorrow)
          .in('status', ['pending', 'confirmed']);

        // Fetch recently confirmed appointments
        const { data: recentConfirmed } = await supabase
          .from('appointments')
          .select('id, appointment_date, appointment_time, status, updated_at, doctor:doctors(profile:profiles!doctors_profile_id_fkey(full_name))')
          .eq('patient_id', userId)
          .eq('status', 'confirmed')
          .gte('updated_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
          .order('updated_at', { ascending: false })
          .limit(5);

        todayAppts?.forEach((apt: any) => {
          const doctorName = Array.isArray(apt.doctor) 
            ? apt.doctor[0]?.profile?.[0]?.full_name || apt.doctor[0]?.profile?.full_name
            : apt.doctor?.profile?.full_name;
          generatedNotifications.push({
            id: `today-${apt.id}`,
            title: 'Appointment Today',
            message: `Your appointment with Dr. ${doctorName || 'Unknown'} is scheduled for ${apt.appointment_time} today.`,
            type: 'reminder',
            read: false,
            created_at: new Date().toISOString(),
            appointment_id: apt.id,
          });
        });

        tomorrowAppts?.forEach((apt: any) => {
          const doctorName = Array.isArray(apt.doctor) 
            ? apt.doctor[0]?.profile?.[0]?.full_name || apt.doctor[0]?.profile?.full_name
            : apt.doctor?.profile?.full_name;
          generatedNotifications.push({
            id: `tomorrow-${apt.id}`,
            title: 'Upcoming Appointment',
            message: `Reminder: You have an appointment with Dr. ${doctorName || 'Unknown'} tomorrow at ${apt.appointment_time}.`,
            type: 'reminder',
            read: false,
            created_at: new Date().toISOString(),
            appointment_id: apt.id,
          });
        });

        recentConfirmed?.forEach((apt: any) => {
          const doctorName = Array.isArray(apt.doctor) 
            ? apt.doctor[0]?.profile?.[0]?.full_name || apt.doctor[0]?.profile?.full_name
            : apt.doctor?.profile?.full_name;
          generatedNotifications.push({
            id: `confirmed-${apt.id}`,
            title: 'Appointment Confirmed',
            message: `Your appointment with Dr. ${doctorName || 'Unknown'} on ${format(new Date(apt.appointment_date), 'MMM d')} has been confirmed.`,
            type: 'status',
            read: false,
            created_at: apt.updated_at,
            appointment_id: apt.id,
          });
        });

      } else if (userRole === 'doctor') {
        // Get doctor ID first
        const { data: doctor } = await supabase
          .from('doctors')
          .select('id')
          .eq('user_id', userId)
          .single();

        if (doctor) {
          // Fetch today's appointments
          const { data: todayAppts } = await supabase
            .from('appointments')
            .select('id, appointment_date, appointment_time, status, patient:profiles!appointments_patient_id_fkey(full_name)')
            .eq('doctor_id', doctor.id)
            .eq('appointment_date', today)
            .in('status', ['pending', 'confirmed']);

          // Fetch new appointments (pending)
          const { data: pendingAppts } = await supabase
            .from('appointments')
            .select('id, appointment_date, appointment_time, created_at, patient:profiles!appointments_patient_id_fkey(full_name)')
            .eq('doctor_id', doctor.id)
            .eq('status', 'pending')
            .gte('created_at', new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString())
            .order('created_at', { ascending: false })
            .limit(5);

          if (todayAppts && todayAppts.length > 0) {
            generatedNotifications.push({
              id: `today-summary`,
              title: 'Today\'s Schedule',
              message: `You have ${todayAppts.length} appointment${todayAppts.length > 1 ? 's' : ''} scheduled for today.`,
              type: 'info',
              read: false,
              created_at: new Date().toISOString(),
            });
          }

          pendingAppts?.forEach((apt: any) => {
            const patientName = Array.isArray(apt.patient) ? apt.patient[0]?.full_name : apt.patient?.full_name;
            generatedNotifications.push({
              id: `new-${apt.id}`,
              title: 'New Appointment Request',
              message: `${patientName || 'A patient'} booked an appointment for ${format(new Date(apt.appointment_date), 'MMM d')} at ${apt.appointment_time}.`,
              type: 'appointment',
              read: false,
              created_at: apt.created_at,
              appointment_id: apt.id,
            });
          });
        }

      } else if (userRole === 'admin') {
        // Fetch recent appointments count
        const { count: todayCount } = await supabase
          .from('appointments')
          .select('*', { count: 'exact', head: true })
          .eq('appointment_date', today);

        // Fetch pending doctor approvals
        const { data: doctors } = await supabase
          .from('doctors')
          .select('id');
        
        const doctorUserIds = doctors?.map(d => d.id) || [];
        
        const { count: pendingDoctors } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .eq('role', 'doctor');

        if (todayCount && todayCount > 0) {
          generatedNotifications.push({
            id: 'today-appointments',
            title: 'Today\'s Activity',
            message: `There are ${todayCount} appointments scheduled for today across all departments.`,
            type: 'info',
            read: false,
            created_at: new Date().toISOString(),
          });
        }

        // Fetch cancelled appointments in last 24 hours
        const { data: cancelledAppts } = await supabase
          .from('appointments')
          .select('id, updated_at')
          .eq('status', 'cancelled')
          .gte('updated_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

        if (cancelledAppts && cancelledAppts.length > 0) {
          generatedNotifications.push({
            id: 'cancelled-summary',
            title: 'Cancelled Appointments',
            message: `${cancelledAppts.length} appointment${cancelledAppts.length > 1 ? 's were' : ' was'} cancelled in the last 24 hours.`,
            type: 'status',
            read: false,
            created_at: new Date().toISOString(),
          });
        }
      }

      setNotifications(generatedNotifications);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userId) {
      fetchNotifications();
    }
  }, [userId, userRole]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAsRead = (id: string) => {
    setNotifications(notifications.map(n => 
      n.id === id ? { ...n, read: true } : n
    ));
  };

  const markAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
  };

  const clearNotification = (id: string) => {
    setNotifications(notifications.filter(n => n.id !== id));
  };

  const getIcon = (type: Notification['type']) => {
    switch (type) {
      case 'appointment':
        return <Calendar className="w-4 h-4 text-chart-4" />;
      case 'reminder':
        return <Clock className="w-4 h-4 text-chart-3" />;
      case 'status':
        return <CheckCircle className="w-4 h-4 text-chart-1" />;
      case 'info':
        return <AlertCircle className="w-4 h-4 text-chart-2" />;
      default:
        return <Bell className="w-4 h-4 text-muted-foreground" />;
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="w-5 h-5 text-muted-foreground" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-destructive rounded-full text-destructive-foreground text-xs flex items-center justify-center font-medium">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="p-4 border-b bg-muted">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-foreground">Notifications</h3>
            {unreadCount > 0 && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-xs text-primary hover:text-primary/80"
                onClick={markAllAsRead}
              >
                Mark all as read
              </Button>
            )}
          </div>
        </div>
        
        <div className="max-h-80 overflow-y-auto">
          {loading ? (
            <div className="p-4 text-center text-muted-foreground">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-8 text-center">
              <Bell className="w-10 h-10 text-muted-foreground/50 mx-auto mb-2" />
              <p className="text-muted-foreground text-sm">No notifications</p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-3 hover:bg-muted cursor-pointer transition-colors ${
                    !notification.read ? 'bg-primary/5' : ''
                  }`}
                  onClick={() => markAsRead(notification.id)}
                >
                  <div className="flex gap-3">
                    <div className="flex-shrink-0 mt-0.5">
                      {getIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className={`text-sm ${!notification.read ? 'font-semibold text-foreground' : 'font-medium text-foreground/80'}`}>
                          {notification.title}
                        </p>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 -mr-2 text-muted-foreground hover:text-destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            clearNotification(notification.id);
                          }}
                        >
                          <XCircle className="w-4 h-4" />
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                        {notification.message}
                      </p>
                      <p className="text-xs text-muted-foreground/70 mt-1">
                        {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
