import React, { useState } from 'react';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isToday, isSameMonth } from 'date-fns';

interface CalendarEvent {
  date: Date;
  type: 'primary' | 'secondary' | 'accent';
}

interface ScheduleItem {
  time: string;
  title: string;
  subtitle: string;
  type: 'primary' | 'secondary' | 'accent';
}

interface CalendarProps {
  events?: CalendarEvent[];
  todaySchedule?: ScheduleItem[];
}

const Calendar: React.FC<CalendarProps> = ({ events = [], todaySchedule = [] }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  
  const prevMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
  };
  
  const nextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };
  
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd });
  
  // Get day of week for the first day (0 = Sunday, 1 = Monday, etc.)
  const startDay = getDay(monthStart);
  
  // Array of day names
  const dayNames = ['Du', 'Se', 'Ch', 'Pa', 'Ju', 'Sh', 'Ya'];
  
  // Function to check if a date has an event
  const getEventType = (date: Date): 'primary' | 'secondary' | 'accent' | null => {
    const event = events.find(e => 
      e.date.getDate() === date.getDate() && 
      e.date.getMonth() === date.getMonth() && 
      e.date.getFullYear() === date.getFullYear()
    );
    return event ? event.type : null;
  };
  
  // Create array with empty slots for days from previous month
  const calendarDays = [];
  for (let i = 0; i < startDay; i++) {
    calendarDays.push(null);
  }
  
  // Add current month days
  monthDays.forEach(day => {
    calendarDays.push(day);
  });
  
  // Fill remaining slots in the last week if needed
  const remainingSlots = 7 - (calendarDays.length % 7);
  if (remainingSlots < 7) {
    for (let i = 0; i < remainingSlots; i++) {
      calendarDays.push(null);
    }
  }
  
  // Group days into weeks
  const weeks = [];
  for (let i = 0; i < calendarDays.length; i += 7) {
    weeks.push(calendarDays.slice(i, i + 7));
  }
  
  return (
    <div className="bg-white rounded-lg card-shadow">
      <div className="p-4 border-b border-neutral-ultralight">
        <h2 className="text-lg font-heading font-medium text-neutral-dark">Dars jadvali</h2>
      </div>
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-neutral-dark font-medium">{format(currentMonth, 'MMMM yyyy')}</h3>
          <div>
            <button 
              className="text-neutral-medium hover:text-primary p-1"
              onClick={prevMonth}
            >
              <span className="material-icons">chevron_left</span>
            </button>
            <button 
              className="text-neutral-medium hover:text-primary p-1"
              onClick={nextMonth}
            >
              <span className="material-icons">chevron_right</span>
            </button>
          </div>
        </div>
        
        <div className="grid grid-cols-7 gap-1 text-center mb-2">
          {dayNames.map((day, i) => (
            <div key={i} className="text-xs text-neutral-medium">{day}</div>
          ))}
        </div>
        
        <div className="grid grid-cols-7 gap-1 text-center">
          {weeks.map((week, weekIndex) => 
            week.map((day, dayIndex) => {
              if (!day) {
                return (
                  <div 
                    key={`${weekIndex}-${dayIndex}`} 
                    className="text-neutral-light text-sm py-2"
                  >
                    {/* Empty cell */}
                  </div>
                );
              }
              
              const isCurrentDay = isToday(day);
              const isSameMonthDay = isSameMonth(day, currentMonth);
              const eventType = getEventType(day);
              
              return (
                <div 
                  key={`${weekIndex}-${dayIndex}`} 
                  className={`
                    text-sm py-2 relative
                    ${isCurrentDay ? 'text-white bg-primary rounded-full' : 
                      isSameMonthDay ? 'text-neutral-medium' : 'text-neutral-light'}
                  `}
                >
                  {format(day, 'd')}
                  {eventType && !isCurrentDay && (
                    <div 
                      className={`
                        absolute bottom-0 left-1/2 transform -translate-x-1/2 h-1 w-1 rounded-full
                        ${eventType === 'primary' ? 'bg-primary' : 
                          eventType === 'secondary' ? 'bg-secondary' : 'bg-accent'}
                      `}
                    ></div>
                  )}
                </div>
              );
            })
          )}
        </div>
        
        {todaySchedule.length > 0 && (
          <div className="mt-6">
            <h4 className="text-sm font-medium text-neutral-dark mb-3">Bugungi darslar</h4>
            <div className="space-y-3">
              {todaySchedule.map((item, index) => (
                <div 
                  key={index} 
                  className={`
                    flex p-3 rounded-lg
                    ${item.type === 'primary' ? 'bg-blue-50' : 
                      item.type === 'secondary' ? 'bg-green-50' : 'bg-amber-50'}
                  `}
                >
                  <span 
                    className={`
                      material-icons mr-3
                      ${item.type === 'primary' ? 'text-primary' : 
                        item.type === 'secondary' ? 'text-secondary' : 'text-accent'}
                    `}
                  >
                    access_time
                  </span>
                  <div>
                    <p className="text-sm font-medium text-neutral-dark">{item.time}</p>
                    <p className="text-xs text-neutral-medium">{item.title}, {item.subtitle}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Calendar;
