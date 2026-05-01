import React from 'react';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, parseISO } from 'date-fns';
import { zhTW } from 'date-fns/locale';
import { Badge } from "@/components/ui/badge";

const WORK_TYPE_COLORS = {
  '清潔': 'bg-blue-100 text-blue-700 border-blue-200',
  '整理': 'bg-purple-100 text-purple-700 border-purple-200',
  '其他': 'bg-stone-100 text-stone-600 border-stone-200',
};
const STATUS_COLORS = {
  '已排班': 'bg-amber-50 border-amber-300',
  '已完成': 'bg-green-50 border-green-300',
  '已取消': 'bg-red-50 border-red-300 opacity-60',
};

export default function ScheduleCalendar({ schedules, viewMode, currentDate, onSelectSchedule, onDayClick }) {
  const days = viewMode === 'week'
    ? eachDayOfInterval({ start: startOfWeek(currentDate, { weekStartsOn: 1 }), end: endOfWeek(currentDate, { weekStartsOn: 1 }) })
    : eachDayOfInterval({ start: startOfMonth(currentDate), end: endOfMonth(currentDate) });

  const getSchedulesForDay = (day) =>
    schedules.filter(s => { try { return isSameDay(parseISO(s.date), day); } catch { return false; } });

  const DAY_NAMES = ['一', '二', '三', '四', '五', '六', '日'];

  return (
    <div className="flex-1 overflow-auto">
      {/* Day headers */}
      <div className={`grid border-b border-stone-200 bg-stone-50`} style={{ gridTemplateColumns: viewMode === 'week' ? 'repeat(7, 1fr)' : 'repeat(7, 1fr)' }}>
        {DAY_NAMES.map(d => (
          <div key={d} className="py-2 text-center text-xs font-semibold text-stone-500">{d}</div>
        ))}
      </div>

      {/* Days grid */}
      {viewMode === 'week' ? (
        <div className="grid" style={{ gridTemplateColumns: 'repeat(7, 1fr)', minHeight: '60vh' }}>
          {days.map((day) => {
            const daySchedules = getSchedulesForDay(day);
            const isToday = isSameDay(day, new Date());
            return (
              <div
                key={day.toISOString()}
                className={`border-r border-b border-stone-200 p-2 min-h-[120px] cursor-pointer hover:bg-amber-50 transition-colors ${isToday ? 'bg-amber-50' : 'bg-white'}`}
                onClick={() => onDayClick(day)}
              >
                <div className={`text-sm font-bold mb-2 w-7 h-7 flex items-center justify-center rounded-full ${isToday ? 'bg-amber-500 text-white' : 'text-stone-700'}`}>
                  {format(day, 'd')}
                </div>
                <div className="space-y-1">
                  {daySchedules.map(s => (
                    <div
                      key={s.id}
                      className={`rounded px-1.5 py-1 text-xs border cursor-pointer hover:shadow-sm transition-shadow ${STATUS_COLORS[s.status] || 'bg-stone-50 border-stone-200'}`}
                      onClick={(e) => { e.stopPropagation(); onSelectSchedule(s); }}
                    >
                      <div className="font-medium truncate">{s.worker_name}</div>
                      <div className="text-stone-500 truncate">{s.time_slot}</div>
                      {s.work_type && (
                        <Badge className={`text-[10px] px-1 py-0 mt-0.5 ${WORK_TYPE_COLORS[s.work_type]}`}>{s.work_type}</Badge>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        // Month view: render weeks row by row
        <MonthGrid days={days} getSchedulesForDay={getSchedulesForDay} onSelectSchedule={onSelectSchedule} onDayClick={onDayClick} currentDate={currentDate} />
      )}
    </div>
  );
}

function MonthGrid({ days, getSchedulesForDay, onSelectSchedule, onDayClick, currentDate }) {
  // Pad days to start from Monday
  const startPad = (days[0].getDay() + 6) % 7;
  const paddedDays = [...Array(startPad).fill(null), ...days];

  const weeks = [];
  for (let i = 0; i < paddedDays.length; i += 7) {
    weeks.push(paddedDays.slice(i, i + 7));
  }

  return (
    <div>
      {weeks.map((week, wi) => (
        <div key={wi} className="grid" style={{ gridTemplateColumns: 'repeat(7, 1fr)' }}>
          {week.map((day, di) => {
            if (!day) return <div key={di} className="border-r border-b border-stone-100 min-h-[80px] bg-stone-50" />;
            const daySchedules = getSchedulesForDay(day);
            const isToday = isSameDay(day, new Date());
            const isCurrentMonth = day.getMonth() === currentDate.getMonth();
            return (
              <div
                key={day.toISOString()}
                className={`border-r border-b border-stone-200 p-1.5 min-h-[80px] cursor-pointer hover:bg-amber-50 transition-colors ${isToday ? 'bg-amber-50' : isCurrentMonth ? 'bg-white' : 'bg-stone-50'}`}
                onClick={() => onDayClick(day)}
              >
                <div className={`text-xs font-semibold mb-1 w-6 h-6 flex items-center justify-center rounded-full ${isToday ? 'bg-amber-500 text-white' : isCurrentMonth ? 'text-stone-700' : 'text-stone-300'}`}>
                  {format(day, 'd')}
                </div>
                {daySchedules.slice(0, 2).map(s => (
                  <div
                    key={s.id}
                    className={`rounded px-1 py-0.5 text-[10px] border mb-0.5 cursor-pointer truncate ${STATUS_COLORS[s.status] || 'bg-stone-50 border-stone-200'}`}
                    onClick={(e) => { e.stopPropagation(); onSelectSchedule(s); }}
                  >
                    {s.worker_name}
                  </div>
                ))}
                {daySchedules.length > 2 && (
                  <div className="text-[10px] text-stone-400">+{daySchedules.length - 2} 筆</div>
                )}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}