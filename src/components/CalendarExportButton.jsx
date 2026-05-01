import React, { useState } from 'react';
import { Calendar, ChevronDown, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';

function pad(n) { return String(n).padStart(2, '0'); }

function toICalDate(dateStr, timeSlot) {
  // dateStr: "2025-01-20", timeSlot: "上午 08:00-12:00" etc.
  const startHour = timeSlot?.includes('08') ? '08' : timeSlot?.includes('13') ? '13' : '18';
  const endHour = timeSlot?.includes('08') ? '12' : timeSlot?.includes('13') ? '17' : '21';
  const base = dateStr.replace(/-/g, '');
  return {
    start: `${base}T${startHour}0000`,
    end: `${base}T${endHour}0000`,
  };
}

export default function CalendarExportButton({ booking }) {
  const [open, setOpen] = useState(false);
  if (!booking?.scheduled_date) return null;

  const title = encodeURIComponent(`HESON 赫頌清潔服務 - ${booking.service_type || ''}`);
  const details = encodeURIComponent(
    `服務類型：${booking.service_type || ''}\n服務地址：${booking.address || ''}\n${booking.cleaner_name ? `管理師：${booking.cleaner_name}` : ''}\n客服：0906-991-023`
  );
  const location = encodeURIComponent(booking.address || '');
  const { start, end } = toICalDate(booking.scheduled_date, booking.time_slot);

  const googleUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${start}/${end}&details=${details}&location=${location}`;

  const icalContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//HESON//Booking//TW',
    'BEGIN:VEVENT',
    `DTSTART:${start}`,
    `DTEND:${end}`,
    `SUMMARY:HESON 赫頌清潔服務 - ${booking.service_type || ''}`,
    `DESCRIPTION:服務地址：${booking.address || ''}\\n客服：0906-991-023`,
    `LOCATION:${booking.address || ''}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');

  const icalBlob = new Blob([icalContent], { type: 'text/calendar;charset=utf-8' });
  const icalUrl = URL.createObjectURL(icalBlob);

  return (
    <div className="relative inline-block">
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="rounded-full border-amber-300 text-amber-700 hover:bg-amber-50 gap-2"
        onClick={() => setOpen(o => !o)}
      >
        <Calendar className="w-4 h-4" />
        加入行事曆
        <ChevronDown className={`w-3 h-3 transition-transform ${open ? 'rotate-180' : ''}`} />
      </Button>
      {open && (
        <div className="absolute left-0 mt-2 bg-white rounded-xl shadow-lg border border-stone-200 overflow-hidden z-50 min-w-[180px]">
          <a
            href={googleUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-3 text-sm text-stone-700 hover:bg-stone-50 transition-colors"
            onClick={() => setOpen(false)}
          >
            <img src="https://www.gstatic.com/images/branding/product/1x/calendar_2020q4_48dp.png" alt="" className="w-4 h-4" />
            Google 日曆
            <ExternalLink className="w-3 h-3 ml-auto text-stone-400" />
          </a>
          <a
            href={icalUrl}
            download={`HESON_${booking.scheduled_date}.ics`}
            className="flex items-center gap-2 px-4 py-3 text-sm text-stone-700 hover:bg-stone-50 transition-colors border-t border-stone-100"
            onClick={() => setOpen(false)}
          >
            <Calendar className="w-4 h-4 text-blue-500" />
            Apple / iCal 下載
          </a>
          <a
            href={`https://outlook.live.com/calendar/0/deeplink/compose?subject=${title}&startdt=${booking.scheduled_date}T${start.slice(9, 11)}:00:00&enddt=${booking.scheduled_date}T${end.slice(9, 11)}:00:00&body=${details}&location=${location}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-3 text-sm text-stone-700 hover:bg-stone-50 transition-colors border-t border-stone-100"
            onClick={() => setOpen(false)}
          >
            <img src="https://res.cdn.office.net/assets/mail/pwa/v2/zh-tw/images/favicon.ico" alt="" className="w-4 h-4" />
            Outlook 日曆
            <ExternalLink className="w-3 h-3 ml-auto text-stone-400" />
          </a>
        </div>
      )}
    </div>
  );
}