import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import AppHeader from "@/components/AppHeader";
import { Calendar, CalendarEvent } from "@/components/Calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertCircle,
  Calendar as CalendarIcon,
  CheckCircle2,
  Clock,
  CreditCard,
  Euro,
  FileText,
  TrendingUp,
} from "lucide-react";

export default function Kalender() {
  const [selectedUnternehmen, setSelectedUnternehmen] = useState<number | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedEvents, setSelectedEvents] = useState<CalendarEvent[]>([]);
  const [detailDialog, setDetailDialog] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);

  // Unternehmen laden
  const { data: unternehmenListe } = trpc.unternehmen.list.useQuery();

  // Berechne Datumsbereich für den aktuellen Monat (plus Puffer)
  const dateRange = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    // Einen Monat vor und nach dem aktuellen Monat
    const vonDatum = new Date(year, month - 1, 1).toISOString().split("T")[0];
    const bisDatum = new Date(year, month + 2, 0).toISOString().split("T")[0];
    return { vonDatum, bisDatum };
  }, [currentMonth]);

  // Fälligkeiten laden
  const { data: faelligkeiten } = trpc.buchungen.faelligkeiten.useQuery(
    {
      unternehmenId: selectedUnternehmen!,
      vonDatum: dateRange.vonDatum,
      bisDatum: dateRange.bisDatum,
    },
    { enabled: !!selectedUnternehmen }
  );

  // Zahlungsübersicht laden
  const { data: zahlungsStats } = trpc.buchungen.zahlungsUebersicht.useQuery(
    { unternehmenId: selectedUnternehmen! },
    { enabled: !!selectedUnternehmen }
  );

  // Konvertiere Fälligkeiten zu CalendarEvents
  const calendarEvents: CalendarEvent[] = useMemo(() => {
    if (!faelligkeiten) return [];
    return faelligkeiten
      .filter((f) => f.date !== null)
      .map((f) => ({
        id: f.id,
        date: new Date(f.date!),
        title: f.title,
        amount: f.amount,
        status: f.status,
        type: f.type,
      }));
  }, [faelligkeiten]);

  // Statistiken für den aktuellen Monat
  const monthStats = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const monthEvents = calendarEvents.filter((e) => {
      return e.date.getFullYear() === year && e.date.getMonth() === month;
    });

    return {
      total: monthEvents.length,
      offen: monthEvents.filter((e) => e.status === "offen").length,
      ueberfaellig: monthEvents.filter((e) => e.status === "ueberfaellig").length,
      bezahlt: monthEvents.filter((e) => e.status === "bezahlt").length,
      summe: monthEvents.reduce((sum, e) => sum + e.amount, 0),
      offeneSumme: monthEvents
        .filter((e) => e.status === "offen" || e.status === "ueberfaellig")
        .reduce((sum, e) => sum + e.amount, 0),
    };
  }, [calendarEvents, currentMonth]);

  // Formatierung
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format(value);
  };

  const formatDate = (date: Date | null) => {
    if (!date) return "-";
    return new Date(date).toLocaleDateString("de-DE", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  // Event-Handler
  const handleDateClick = (date: Date, events: CalendarEvent[]) => {
    setSelectedDate(date);
    setSelectedEvents(events);
    if (events.length > 0) {
      setDetailDialog(true);
    }
  };

  const handleEventClick = (event: CalendarEvent) => {
    setSelectedEvent(event);
    setSelectedEvents([event]);
    setSelectedDate(event.date);
    setDetailDialog(true);
  };

  // Status-Badge
  const getStatusBadge = (status: CalendarEvent["status"]) => {
    switch (status) {
      case "offen":
        return (
          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
            <Clock className="w-3 h-3 mr-1" /> Offen
          </Badge>
        );
      case "teilweise_bezahlt":
        return (
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
            <TrendingUp className="w-3 h-3 mr-1" /> Teilweise
          </Badge>
        );
      case "bezahlt":
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            <CheckCircle2 className="w-3 h-3 mr-1" /> Bezahlt
          </Badge>
        );
      case "ueberfaellig":
        return (
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
            <AlertCircle className="w-3 h-3 mr-1" /> Überfällig
          </Badge>
        );
      default:
        return <Badge variant="outline">Unbekannt</Badge>;
    }
  };

  // Buchungsart-Badge
  const getTypeBadge = (type: CalendarEvent["type"]) => {
    switch (type) {
      case "aufwand":
        return <Badge variant="secondary">Aufwand</Badge>;
      case "ertrag":
        return <Badge className="bg-teal-100 text-teal-700">Ertrag</Badge>;
      case "anlage":
        return <Badge variant="outline">Anlage</Badge>;
      default:
        return <Badge variant="outline">Sonstig</Badge>;
    }
  };

  const MONTHS = [
    "Januar", "Februar", "März", "April", "Mai", "Juni",
    "Juli", "August", "September", "Oktober", "November", "Dezember"
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <AppHeader />

      <main className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
              <CalendarIcon className="w-8 h-8 text-teal-600" />
              Fälligkeitskalender
            </h1>
            <p className="text-slate-600 mt-1">
              Übersicht aller anstehenden Zahlungen und Fälligkeiten
            </p>
          </div>

          <div className="flex items-center gap-4">
            <Select
              value={selectedUnternehmen?.toString() || ""}
              onValueChange={(v) => setSelectedUnternehmen(parseInt(v))}
            >
              <SelectTrigger className="w-[250px]">
                <SelectValue placeholder="Unternehmen wählen" />
              </SelectTrigger>
              <SelectContent>
                {unternehmenListe?.map((u) => (
                  <SelectItem key={u.unternehmen.id} value={u.unternehmen.id.toString()}>
                    {u.unternehmen.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {!selectedUnternehmen ? (
          <Card className="text-center py-12">
            <CardContent>
              <CalendarIcon className="w-16 h-16 mx-auto text-slate-300 mb-4" />
              <h2 className="text-xl font-semibold text-slate-700 mb-2">
                Kein Unternehmen ausgewählt
              </h2>
              <p className="text-slate-500">
                Wählen Sie ein Unternehmen aus, um den Fälligkeitskalender anzuzeigen.
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Monats-Statistiken */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <Card className="border-l-4 border-l-teal-500">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
                    <CalendarIcon className="w-4 h-4" />
                    Fälligkeiten im {MONTHS[currentMonth.getMonth()]}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-slate-900">{monthStats.total}</div>
                  <p className="text-sm text-slate-500 mt-1">
                    Gesamt: {formatCurrency(monthStats.summe)}
                  </p>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-yellow-500">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
                    <Clock className="w-4 h-4" /> Offen
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-yellow-600">{monthStats.offen}</div>
                  <p className="text-sm text-slate-500 mt-1">Noch zu zahlen</p>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-red-500">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" /> Überfällig
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-red-600">{monthStats.ueberfaellig}</div>
                  <p className="text-sm text-slate-500 mt-1">Fälligkeit überschritten</p>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-green-500">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" /> Bezahlt
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-green-600">{monthStats.bezahlt}</div>
                  <p className="text-sm text-slate-500 mt-1">Erledigt</p>
                </CardContent>
              </Card>
            </div>

            {/* Offene Summe Hinweis */}
            {monthStats.offeneSumme > 0 && (
              <Card className="mb-6 bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200">
                <CardContent className="py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Euro className="w-6 h-6 text-amber-600" />
                      <div>
                        <p className="font-medium text-amber-900">
                          Offene Fälligkeiten im {MONTHS[currentMonth.getMonth()]}
                        </p>
                        <p className="text-sm text-amber-700">
                          {monthStats.offen + monthStats.ueberfaellig} Rechnungen noch nicht bezahlt
                        </p>
                      </div>
                    </div>
                    <div className="text-2xl font-bold text-amber-900">
                      {formatCurrency(monthStats.offeneSumme)}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Kalender */}
            <Calendar
              events={calendarEvents}
              onDateClick={handleDateClick}
              onEventClick={handleEventClick}
            />

            {/* Nächste Fälligkeiten */}
            <Card className="mt-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-teal-600" />
                  Nächste Fälligkeiten
                </CardTitle>
              </CardHeader>
              <CardContent>
                {calendarEvents.filter((e) => e.date >= new Date() && e.status !== "bezahlt").length === 0 ? (
                  <div className="text-center py-8 text-slate-500">
                    <CheckCircle2 className="w-12 h-12 mx-auto text-green-300 mb-3" />
                    <p>Keine anstehenden Fälligkeiten</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Fälligkeit</TableHead>
                        <TableHead>Geschäftspartner</TableHead>
                        <TableHead>Typ</TableHead>
                        <TableHead className="text-right">Betrag</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {calendarEvents
                        .filter((e) => e.status !== "bezahlt")
                        .sort((a, b) => a.date.getTime() - b.date.getTime())
                        .slice(0, 10)
                        .map((event) => (
                          <TableRow
                            key={event.id}
                            className="cursor-pointer hover:bg-slate-50"
                            onClick={() => handleEventClick(event)}
                          >
                            <TableCell>
                              <span
                                className={
                                  event.status === "ueberfaellig"
                                    ? "text-red-600 font-medium"
                                    : ""
                                }
                              >
                                {event.date.toLocaleDateString("de-DE")}
                              </span>
                            </TableCell>
                            <TableCell className="font-medium">{event.title}</TableCell>
                            <TableCell>{getTypeBadge(event.type)}</TableCell>
                            <TableCell className="text-right font-medium">
                              {formatCurrency(event.amount)}
                            </TableCell>
                            <TableCell>{getStatusBadge(event.status)}</TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </main>

      {/* Detail-Dialog */}
      <Dialog open={detailDialog} onOpenChange={setDetailDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CalendarIcon className="w-5 h-5 text-teal-600" />
              {selectedDate && formatDate(selectedDate)}
            </DialogTitle>
          </DialogHeader>

          {selectedEvents.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <FileText className="w-12 h-12 mx-auto text-slate-300 mb-3" />
              <p>Keine Fälligkeiten an diesem Tag</p>
            </div>
          ) : (
            <div className="space-y-4">
              {selectedEvents.map((event) => (
                <Card key={event.id} className="overflow-hidden">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-semibold text-slate-900">{event.title}</h3>
                        <p className="text-sm text-slate-500">
                          Fällig am {event.date.toLocaleDateString("de-DE")}
                        </p>
                      </div>
                      {getStatusBadge(event.status)}
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {getTypeBadge(event.type)}
                      </div>
                      <div className="text-xl font-bold text-slate-900">
                        {formatCurrency(event.amount)}
                      </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-slate-100 flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setDetailDialog(false);
                          // Navigation zur Zahlungsseite könnte hier implementiert werden
                        }}
                      >
                        <CreditCard className="w-4 h-4 mr-1" />
                        Zahlung erfassen
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {selectedEvents.length > 1 && (
                <div className="pt-4 border-t border-slate-200">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-600">Gesamt ({selectedEvents.length} Fälligkeiten)</span>
                    <span className="font-bold text-slate-900">
                      {formatCurrency(selectedEvents.reduce((sum, e) => sum + e.amount, 0))}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
