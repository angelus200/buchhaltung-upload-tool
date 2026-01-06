import { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface CalendarEvent {
  id: number;
  date: Date;
  title: string;
  amount: number;
  status: "offen" | "teilweise_bezahlt" | "bezahlt" | "ueberfaellig";
  type: "aufwand" | "ertrag" | "anlage" | "sonstig";
}

interface CalendarProps {
  events: CalendarEvent[];
  onDateClick?: (date: Date, events: CalendarEvent[]) => void;
  onEventClick?: (event: CalendarEvent) => void;
}

const WEEKDAYS = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];
const MONTHS = [
  "Januar", "Februar", "März", "April", "Mai", "Juni",
  "Juli", "August", "September", "Oktober", "November", "Dezember"
];

export function Calendar({ events, onDateClick, onEventClick }: CalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const { year, month } = useMemo(() => ({
    year: currentDate.getFullYear(),
    month: currentDate.getMonth(),
  }), [currentDate]);

  // Erster Tag des Monats
  const firstDayOfMonth = useMemo(() => new Date(year, month, 1), [year, month]);
  
  // Letzter Tag des Monats
  const lastDayOfMonth = useMemo(() => new Date(year, month + 1, 0), [year, month]);
  
  // Erster Wochentag (0 = Sonntag, 1 = Montag, ...)
  const firstWeekday = useMemo(() => {
    const day = firstDayOfMonth.getDay();
    return day === 0 ? 6 : day - 1; // Montag als erster Tag
  }, [firstDayOfMonth]);

  // Anzahl der Tage im Monat
  const daysInMonth = lastDayOfMonth.getDate();

  // Kalender-Grid erstellen
  const calendarDays = useMemo(() => {
    const days: (Date | null)[] = [];
    
    // Leere Tage vor dem ersten Tag des Monats
    for (let i = 0; i < firstWeekday; i++) {
      days.push(null);
    }
    
    // Tage des Monats
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }
    
    // Auffüllen bis zur vollen Woche
    while (days.length % 7 !== 0) {
      days.push(null);
    }
    
    return days;
  }, [year, month, firstWeekday, daysInMonth]);

  // Events nach Datum gruppieren
  const eventsByDate = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    events.forEach(event => {
      const dateKey = event.date.toISOString().split("T")[0];
      if (!map.has(dateKey)) {
        map.set(dateKey, []);
      }
      map.get(dateKey)!.push(event);
    });
    return map;
  }, [events]);

  // Vorheriger Monat
  const goToPreviousMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  // Nächster Monat
  const goToNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  // Heute
  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Prüfen ob ein Tag heute ist
  const isToday = (date: Date | null) => {
    if (!date) return false;
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  // Events für einen Tag holen
  const getEventsForDate = (date: Date | null) => {
    if (!date) return [];
    const dateKey = date.toISOString().split("T")[0];
    return eventsByDate.get(dateKey) || [];
  };

  // Status-Farbe
  const getStatusColor = (status: CalendarEvent["status"]) => {
    switch (status) {
      case "offen":
        return "bg-yellow-500";
      case "teilweise_bezahlt":
        return "bg-blue-500";
      case "bezahlt":
        return "bg-green-500";
      case "ueberfaellig":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  // Gesamtbetrag für einen Tag
  const getTotalForDate = (date: Date | null) => {
    const dayEvents = getEventsForDate(date);
    return dayEvents.reduce((sum, e) => sum + e.amount, 0);
  };

  // Formatierung
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("de-DE", { 
      style: "currency", 
      currency: "EUR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-gradient-to-r from-teal-50 to-slate-50">
        <div className="flex items-center gap-2">
          <CalendarIcon className="w-5 h-5 text-teal-600" />
          <h2 className="text-lg font-semibold text-slate-900">
            {MONTHS[month]} {year}
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={goToToday}
            className="text-xs"
          >
            Heute
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={goToPreviousMonth}
            className="h-8 w-8"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={goToNextMonth}
            className="h-8 w-8"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Wochentage */}
      <div className="grid grid-cols-7 border-b border-slate-200">
        {WEEKDAYS.map((day) => (
          <div
            key={day}
            className="py-2 text-center text-xs font-medium text-slate-500 bg-slate-50"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Kalender-Grid */}
      <div className="grid grid-cols-7">
        {calendarDays.map((date, index) => {
          const dayEvents = getEventsForDate(date);
          const hasEvents = dayEvents.length > 0;
          const hasOverdue = dayEvents.some(e => e.status === "ueberfaellig");
          const hasOpen = dayEvents.some(e => e.status === "offen");
          const total = getTotalForDate(date);

          return (
            <div
              key={index}
              className={cn(
                "min-h-[100px] p-1 border-b border-r border-slate-100 transition-colors",
                date ? "cursor-pointer hover:bg-slate-50" : "bg-slate-50/50",
                isToday(date) && "bg-teal-50/50"
              )}
              onClick={() => date && onDateClick?.(date, dayEvents)}
            >
              {date && (
                <>
                  {/* Tag-Nummer */}
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className={cn(
                        "w-7 h-7 flex items-center justify-center text-sm rounded-full",
                        isToday(date)
                          ? "bg-teal-600 text-white font-semibold"
                          : "text-slate-700"
                      )}
                    >
                      {date.getDate()}
                    </span>
                    {hasEvents && (
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-[10px] px-1.5 py-0",
                          hasOverdue
                            ? "border-red-200 bg-red-50 text-red-700"
                            : hasOpen
                            ? "border-yellow-200 bg-yellow-50 text-yellow-700"
                            : "border-green-200 bg-green-50 text-green-700"
                        )}
                      >
                        {dayEvents.length}
                      </Badge>
                    )}
                  </div>

                  {/* Events */}
                  <div className="space-y-0.5">
                    {dayEvents.slice(0, 3).map((event) => (
                      <div
                        key={event.id}
                        className={cn(
                          "text-[10px] px-1.5 py-0.5 rounded truncate cursor-pointer",
                          event.status === "ueberfaellig"
                            ? "bg-red-100 text-red-700"
                            : event.status === "offen"
                            ? "bg-yellow-100 text-yellow-700"
                            : event.status === "teilweise_bezahlt"
                            ? "bg-blue-100 text-blue-700"
                            : "bg-green-100 text-green-700"
                        )}
                        onClick={(e) => {
                          e.stopPropagation();
                          onEventClick?.(event);
                        }}
                        title={`${event.title} - ${formatCurrency(event.amount)}`}
                      >
                        {event.title}
                      </div>
                    ))}
                    {dayEvents.length > 3 && (
                      <div className="text-[10px] text-slate-500 px-1.5">
                        +{dayEvents.length - 3} weitere
                      </div>
                    )}
                  </div>

                  {/* Gesamtbetrag */}
                  {hasEvents && (
                    <div className="mt-1 text-[10px] font-medium text-slate-600 px-1">
                      {formatCurrency(total)}
                    </div>
                  )}
                </>
              )}
            </div>
          );
        })}
      </div>

      {/* Legende */}
      <div className="flex items-center gap-4 p-3 border-t border-slate-200 bg-slate-50">
        <span className="text-xs text-slate-500">Legende:</span>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-red-500" />
          <span className="text-xs text-slate-600">Überfällig</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-yellow-500" />
          <span className="text-xs text-slate-600">Offen</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-blue-500" />
          <span className="text-xs text-slate-600">Teilweise</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-green-500" />
          <span className="text-xs text-slate-600">Bezahlt</span>
        </div>
      </div>
    </div>
  );
}

export type { CalendarEvent };
