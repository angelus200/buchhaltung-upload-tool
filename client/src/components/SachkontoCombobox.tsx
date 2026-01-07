"use client";

import * as React from "react";
import { Check, ChevronsUpDown, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface Sachkonto {
  kontonummer: string;
  bezeichnung: string;
  kategorie?: string;
}

interface SachkontoComboboxProps {
  value: string;
  onValueChange: (value: string) => void;
  sachkontenGrouped?: Record<string, Sachkonto[]>;
  fallbackKonten?: { konto: string; bezeichnung: string }[];
  placeholder?: string;
  disabled?: boolean;
}

export function SachkontoCombobox({
  value,
  onValueChange,
  sachkontenGrouped,
  fallbackKonten = [],
  placeholder = "Konto wählen...",
  disabled = false,
}: SachkontoComboboxProps) {
  const [open, setOpen] = React.useState(false);

  // Finde das ausgewählte Konto für die Anzeige
  const selectedKonto = React.useMemo(() => {
    if (!value) return null;
    
    // Suche in gruppierten Sachkonten
    if (sachkontenGrouped) {
      for (const konten of Object.values(sachkontenGrouped)) {
        const found = konten.find((k) => k.kontonummer === value);
        if (found) return found;
      }
    }
    
    // Suche in Fallback-Konten
    const fallback = fallbackKonten.find((k) => k.konto === value);
    if (fallback) return { kontonummer: fallback.konto, bezeichnung: fallback.bezeichnung };
    
    return null;
  }, [value, sachkontenGrouped, fallbackKonten]);

  const hasDatabaseKonten = sachkontenGrouped && Object.keys(sachkontenGrouped).length > 0;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between font-normal"
          disabled={disabled}
        >
          {selectedKonto ? (
            <span className="truncate">
              <span className="font-mono text-xs">{selectedKonto.kontonummer}</span>
              <span className="ml-2 text-muted-foreground">{selectedKonto.bezeichnung}</span>
            </span>
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0" align="start">
        <Command>
          <CommandInput placeholder="Konto suchen..." />
          <CommandList>
            <CommandEmpty>Kein Konto gefunden.</CommandEmpty>
            {hasDatabaseKonten ? (
              // Gruppierte Anzeige aus der Datenbank
              Object.entries(sachkontenGrouped!).map(([kategorie, konten]) => (
                <CommandGroup key={kategorie} heading={kategorie}>
                  {konten.map((konto) => (
                    <CommandItem
                      key={konto.kontonummer}
                      value={`${konto.kontonummer} ${konto.bezeichnung}`}
                      onSelect={() => {
                        onValueChange(konto.kontonummer);
                        setOpen(false);
                      }}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          value === konto.kontonummer ? "opacity-100" : "opacity-0"
                        )}
                      />
                      <span className="font-mono text-xs w-12">{konto.kontonummer}</span>
                      <span className="ml-2 truncate">{konto.bezeichnung}</span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              ))
            ) : (
              // Fallback auf statische Konten
              <CommandGroup heading="Sachkonten">
                {fallbackKonten.map((konto) => (
                  <CommandItem
                    key={konto.konto}
                    value={`${konto.konto} ${konto.bezeichnung}`}
                    onSelect={() => {
                      onValueChange(konto.konto);
                      setOpen(false);
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === konto.konto ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <span className="font-mono text-xs w-12">{konto.konto}</span>
                    <span className="ml-2 truncate">{konto.bezeichnung}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
