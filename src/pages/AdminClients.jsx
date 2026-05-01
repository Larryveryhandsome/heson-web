import React, { useState, useEffect } from 'react';
import Sidebar from "@/components/dashboard/Sidebar";
import MobileNav from "@/components/dashboard/MobileNav";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { User, Phone, MapPin, Home } from "lucide-react";
import { motion } from "framer-motion";
import { createPageUrl } from "@/utils";

export default function AdminClients() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const loadUser = async () => {
      const isAuth = await base44.auth.isAuthenticated();
      if (!isAuth) {
        base44.auth.redirectToLogin();
        return;
      }
      const userData = await base44.auth.me();
      if (userData.role !== 'admin') {
        window.location.href = createPageUrl("Home");
        return;
      }
      setUser(userData);
    };
    loadUser();
  }, []);

  const { data: clients } = useQuery({
    queryKey: ['allClients'],
    queryFn: () => base44.entities.ClientProfile.list('-created_date'),
    initialData: [],
  });

  const { data: bookings } = useQuery({
    queryKey: ['allBookings'],
    queryFn: () => base44.entities.Booking.list(),
    initialData: [],
  });

  const getClientBookingCount = (clientId) => {
    return bookings?.filter(b => b.client_id === clientId).length || 0;
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 flex">
      <div className="hidden lg:block">
        <Sidebar userRole="admin" userName={user?.full_name} />
      </div>
      <MobileNav userRole="admin" userName={user?.full_name} />
      
      <main className="flex-1 pt-16 lg:pt-0">
        <div className="p-6 lg:p-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl font-medium text-stone-800">客戶管理</h1>
            <p className="text-stone-500 mt-1">查看與管理所有客戶資料</p>
          </div>

          {/* Stats */}
          <div className="grid sm:grid-cols-3 gap-4 mb-8">
            <Card className="border-0 shadow-sm">
              <CardContent className="p-6">
                <p className="text-sm text-stone-500">總客戶數</p>
                <p className="text-3xl font-semibold text-stone-800 mt-1">{clients?.length || 0}</p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm">
              <CardContent className="p-6">
                <p className="text-sm text-stone-500">訂閱客戶</p>
                <p className="text-3xl font-semibold text-amber-600 mt-1">
                  {clients?.filter(c => c.subscription_plan && c.subscription_plan !== '無').length || 0}
                </p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm">
              <CardContent className="p-6">
                <p className="text-sm text-stone-500">總預約數</p>
                <p className="text-3xl font-semibold text-blue-600 mt-1">{bookings?.length || 0}</p>
              </CardContent>
            </Card>
          </div>

          {/* Clients Table */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <Card className="border-0 shadow-sm overflow-hidden">
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-stone-50">
                        <TableHead>客戶</TableHead>
                        <TableHead>聯絡資訊</TableHead>
                        <TableHead>住宅資訊</TableHead>
                        <TableHead>訂閱方案</TableHead>
                        <TableHead>預約次數</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {clients?.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-12 text-stone-400">
                            暫無客戶資料
                          </TableCell>
                        </TableRow>
                      ) : (
                        clients?.map((client) => (
                          <TableRow key={client.id} className="hover:bg-stone-50">
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-stone-100 rounded-full flex items-center justify-center">
                                  <User className="w-5 h-5 text-stone-500" />
                                </div>
                                <div>
                                  <p className="font-medium text-stone-800">客戶 #{client.id?.slice(-6)}</p>
                                  <p className="text-xs text-stone-400">
                                    {client.has_pets ? '🐾 有寵物' : ''}
                                  </p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="space-y-1">
                                <div className="flex items-center gap-2 text-sm text-stone-600">
                                  <Phone className="w-3 h-3" />
                                  {client.phone || '-'}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="space-y-1">
                                <div className="flex items-center gap-2 text-sm text-stone-600">
                                  <Home className="w-3 h-3" />
                                  {client.housing_type || '-'} / {client.square_footage || '-'} 坪
                                </div>
                                <div className="flex items-start gap-2 text-xs text-stone-400">
                                  <MapPin className="w-3 h-3 flex-shrink-0 mt-0.5" />
                                  <span className="line-clamp-1">{client.address || '-'}</span>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              {client.subscription_plan && client.subscription_plan !== '無' ? (
                                <Badge className="bg-amber-100 text-amber-700">
                                  {client.subscription_plan}
                                </Badge>
                              ) : (
                                <Badge variant="secondary" className="bg-stone-100 text-stone-500">
                                  無訂閱
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              <span className="font-medium text-stone-700">
                                {getClientBookingCount(client.user_id)} 次
                              </span>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </main>
    </div>
  );
}