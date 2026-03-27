import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar as CalendarIcon } from 'lucide-react';
import { DayPicker } from 'react-day-picker';
import { format, setYear, getYear } from 'date-fns';
import 'react-day-picker/style.css';

export interface CustomDatePickerProps {
    label?: string;
    value: Date | undefined;
    onChange: (date: Date | undefined) => void;
    placeholder?: string;
    className?: string;
    minDate?: Date;
    maxDate?: Date;
}

export function CustomDatePicker({
    label,
    value,
    onChange,
    placeholder = 'Pick a date',
    className = '',
    minDate,
    maxDate,
}: CustomDatePickerProps) {
    const [open, setOpen] = useState(false);
    const [view, setView] = useState<'calendar' | 'years'>('calendar');
    const [month, setMonth] = useState<Date>(value || new Date());
    const ref = useRef<HTMLDivElement>(null);

    // Dynamic portal positioning identical to CustomSelect
    const [coords, setCoords] = useState({ top: 0, left: 0, width: 0, bottom: 0, dropUp: false });

    // Generate years array for grid
    const currentYear = new Date().getFullYear();
    const minCalculatedYear = minDate ? minDate.getFullYear() : 1930;
    
    // Context-aware max year: 
    // If picking birthdays (no minDate), don't show future years.
    // If scheduling (minDate >= today), allow up to 5 years ahead.
    const maxCalculatedYear = maxDate 
        ? maxDate.getFullYear() 
        : (minDate && minDate.getFullYear() >= currentYear)
            ? currentYear + 5
            : currentYear;
            
    const years = Array.from(
        { length: maxCalculatedYear - minCalculatedYear + 1 },
        (_, i) => maxCalculatedYear - i
    );

    const updatePosition = () => {
        if (ref.current) {
            const rect = ref.current.getBoundingClientRect();
            // Calendar is taller, needs ~350px
            const dropUp = window.innerHeight - rect.bottom < 350; 
            setCoords({
                top: rect.bottom + 6,
                bottom: window.innerHeight - rect.top + 6,
                left: rect.left,
                width: rect.width,
                dropUp
            });
        }
    };

    useEffect(() => {
        updatePosition();
        if (open) {
            window.addEventListener('scroll', updatePosition, true);
            window.addEventListener('resize', updatePosition);
        }

        const handler = (e: MouseEvent) => {
            const isInsideTrigger = ref.current?.contains(e.target as Node);
            const isInsidePortal = (e.target as HTMLElement).closest('.datepicker-portal-container');
            if (!isInsideTrigger && !isInsidePortal) {
                setOpen(false);
                setTimeout(() => setView('calendar'), 200); // reset view smoothly
            }
        };

        document.addEventListener('mousedown', handler, true);
        return () => {
            document.removeEventListener('mousedown', handler, true);
            window.removeEventListener('scroll', updatePosition, true);
            window.removeEventListener('resize', updatePosition);
        };
    }, [open]);

    const displayValue = value ? format(value, 'MMM d, yyyy') : placeholder;

    return (
        <div ref={ref} className={className}>
            {label && <label className="block text-sm font-medium mb-1.5">{label}</label>}

            <button
                type="button"
                onClick={() => setOpen(v => !v)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl border text-sm text-left transition-all ${
                    open
                        ? 'border-primary/50 ring-2 ring-primary/20 bg-muted/50'
                        : 'border-border bg-muted/50 hover:border-primary/30'
                }`}
            >
                <CalendarIcon className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                <span className={`flex-1 truncate ${value ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
                    {displayValue}
                </span>
            </button>

            {typeof document !== 'undefined' && createPortal(
                <AnimatePresence>
                    {open && (
                        <motion.div
                            initial={{ opacity: 0, y: coords.dropUp ? 6 : -6, scale: 0.96 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: coords.dropUp ? 6 : -6, scale: 0.96 }}
                            transition={{ duration: 0.15, ease: 'easeOut' }}
                            style={{
                                position: 'fixed',
                                left: coords.left,
                                minWidth: 230,
                                top: coords.dropUp ? 'auto' : coords.top,
                                bottom: coords.dropUp ? coords.bottom : 'auto',
                                zIndex: 99999
                            }}
                            className="datepicker-portal-container bg-card border border-border rounded-xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.3)] dark:shadow-[0_10px_40px_-10px_rgba(0,0,0,0.8)] overflow-hidden p-3 w-max"
                        >
                            <div className="w-[260px] relative">
                                {view === 'years' ? (
                                    <motion.div 
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className="h-[280px] overflow-y-auto grid grid-cols-3 gap-2 p-1 custom-scrollbar"
                                    >
                                        {years.map(y => (
                                            <button
                                                key={y}
                                                type="button"
                                                onClick={() => {
                                                    setMonth(setYear(month, y));
                                                    setView('calendar');
                                                }}
                                                className={`py-2 rounded-lg text-sm transition-all ${
                                                    getYear(month) === y
                                                        ? 'bg-primary text-primary-foreground font-semibold shadow-md'
                                                        : 'hover:bg-muted text-muted-foreground hover:text-foreground'
                                                }`}
                                            >
                                                {y}
                                            </button>
                                        ))}
                                    </motion.div>
                                ) : (
                                    <DayPicker
                                        mode="single"
                                        selected={value}
                                        onSelect={(d) => { if(d) { onChange(d); setOpen(false); } }}
                                        month={month}
                                        onMonthChange={setMonth}
                                        showOutsideDays
                                        disabled={maxDate ? { after: maxDate } : undefined}
                                        components={{
                                            CaptionLabel: () => (
                                                <button
                                                    type="button"
                                                    onClick={() => setView('years')}
                                                    className="font-semibold hover:bg-muted/80 px-3 py-1 -ml-2 rounded-md transition-colors text-sm flex items-center gap-1"
                                                >
                                                    {format(month, 'MMMM yyyy')}
                                                </button>
                                            )
                                        }}
                                    />
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>,
                document.body
            )}
        </div>
    );
}
