import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import Navbar from '@/components/landing/Navbar';
import Footer from '@/components/landing/Footer';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function PaymentResult() {
  const [status, setStatus] = useState('loading');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const rtnCode = params.get('RtnCode');
    if (rtnCode === '1') {
      setStatus('success');
    } else if (rtnCode !== null) {
      setStatus('failed');
    } else {
      // 可能是直接訪問此頁
      setStatus('unknown');
    }
  }, []);

  return (
    <div className="min-h-screen">
      <Navbar />
      <section className="pt-32 pb-20 min-h-[80vh] flex items-center bg-gradient-to-br from-stone-50 via-amber-50/30 to-stone-100">
        <div className="container mx-auto px-6 text-center max-w-lg">
          {status === 'loading' && (
            <Loader2 className="w-16 h-16 animate-spin text-stone-400 mx-auto mb-4" />
          )}
          {status === 'success' && (
            <>
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-10 h-10 text-green-600" />
              </div>
              <h1 className="text-3xl font-medium text-stone-800 mb-4">付款成功！</h1>
              <p className="text-stone-600 mb-8">您的預約已確認，我們將於 24 小時內與您聯繫服務細節。</p>
              <Link to={createPageUrl('ClientDashboard')}>
                <Button className="bg-stone-800 hover:bg-stone-900 text-white rounded-full px-8">
                  查看我的預約
                </Button>
              </Link>
            </>
          )}
          {(status === 'failed' || status === 'unknown') && (
            <>
              <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <XCircle className="w-10 h-10 text-red-500" />
              </div>
              <h1 className="text-3xl font-medium text-stone-800 mb-4">付款未完成</h1>
              <p className="text-stone-600 mb-8">付款過程中發生問題，您的預約尚未確認。請重新嘗試或聯繫客服。</p>
              <div className="flex gap-3 justify-center">
                <Link to={createPageUrl('BookingForm')}>
                  <Button className="bg-stone-800 hover:bg-stone-900 text-white rounded-full px-8">
                    重新預約
                  </Button>
                </Link>
                <a href="https://lin.ee/xKVxq7Y" target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" className="rounded-full px-8">LINE 聯繫客服</Button>
                </a>
              </div>
            </>
          )}
        </div>
      </section>
      <Footer />
    </div>
  );
}