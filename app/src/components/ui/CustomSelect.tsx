import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Search, CheckCircle2 } from 'lucide-react';

export interface SelectOption {
    value: string;
    label: string;
    subtitle?: string;
}

interface CustomSelectProps {
    /** Field label rendered above the trigger */
    label?: string;
    /** Currently selected value */
    value: string;
    /** Called when user picks an option */
    onChange: (value: string) => void;
    /** The list of options */
    options: SelectOption[];
    /** Placeholder when nothing is selected */
    placeholder?: string;
    /** Show a search box inside the dropdown */
    searchable?: boolean;
    /** Extra CSS classes on the outermost wrapper */
    className?: string;
}

export function CustomSelect({
    label,
    value,
    onChange,
    options,
    placeholder = '— Select —',
    searchable = false,
    className = '',
}: CustomSelectProps) {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState('');
    const ref = useRef<HTMLDivElement>(null);

    // close on outside click and update position dynamically
    const [coords, setCoords] = useState({ top: 0, left: 0, width: 0, bottom: 0, dropUp: false });

    const updatePosition = () => {
        if (ref.current) {
            const rect = ref.current.getBoundingClientRect();
            const dropUp = window.innerHeight - rect.bottom < 280; // if less than 280px below, open upwards
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
            // Check if clicking outside the original ref AND outside the portal dropdown
            const isInsideTrigger = ref.current?.contains(e.target as Node);
            
            if (!isInsideTrigger && !(e.target as HTMLElement).closest('.select-portal-container')) {
                setOpen(false);
            }
        };
        
        document.addEventListener('mousedown', handler);
        return () => {
            document.removeEventListener('mousedown', handler);
            window.removeEventListener('scroll', updatePosition, true);
            window.removeEventListener('resize', updatePosition);
        };
    }, [open]);

    const selected = options.find(o => o.value === value);

    const filtered = options.filter(o =>
        o.label.toLowerCase().includes(search.toLowerCase()) ||
        (o.subtitle ?? '').toLowerCase().includes(search.toLowerCase()),
    );

    return (
        <div ref={ref} className={className}>
            {label && <label className="block text-sm font-medium mb-1.5">{label}</label>}

            {/* trigger */}
            <button
                type="button"
                onClick={() => { setOpen(v => !v); setSearch(''); }}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl border text-sm text-left transition-all ${
                    open
                        ? 'border-primary/50 ring-2 ring-primary/20 bg-muted/50'
                        : 'border-border bg-muted/50 hover:border-primary/30'
                }`}
            >
                <span className={`flex-1 truncate ${selected ? 'text-foreground' : 'text-muted-foreground'}`}>
                    {selected ? (selected.subtitle ? `${selected.label} · ${selected.subtitle}` : selected.label) : placeholder}
                </span>
                <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${open ? 'rotate-180' : ''}`} />
            </button>

            {/* dropdown via portal to break out of all modal boundaries */}
            {typeof document !== 'undefined' && createPortal(
                <AnimatePresence>
                    {open && (
                        <motion.div
                            initial={{ opacity: 0, y: coords.dropUp ? 6 : -6, scale: 0.96 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: coords.dropUp ? 6 : -6, scale: 0.96 }}
                            transition={{ duration: 0.15, ease: "easeOut" }}
                            style={{
                                position: 'fixed',
                                left: coords.left,
                                width: coords.width,
                                top: coords.dropUp ? 'auto' : coords.top,
                                bottom: coords.dropUp ? coords.bottom : 'auto',
                                zIndex: 99999
                            }}
                            className="select-portal-container bg-card border border-border rounded-xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.3)] dark:shadow-[0_10px_40px_-10px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col max-h-[250px]"
                        >
                            {searchable && (
                                <div className="p-2 border-b border-border flex-shrink-0">
                                    <div className="relative">
                                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                                        <input
                                            autoFocus
                                            value={search}
                                            onChange={e => setSearch(e.target.value)}
                                            placeholder="Search..."
                                            className="w-full pl-8 pr-3 py-2 rounded-lg bg-muted text-sm focus:outline-none focus:ring-1 border border-border/50"
                                        />
                                    </div>
                                </div>
                            )}

                            <div className="overflow-y-auto p-1.5 scrollbar-thin">
                                {filtered.length === 0 ? (
                                    <p className="text-xs text-muted-foreground text-center py-4">No options found</p>
                                ) : (
                                    filtered.map(opt => {
                                        const active = opt.value === value;
                                        return (
                                            <button
                                                type="button"
                                                key={opt.value}
                                                onClick={() => { onChange(opt.value); setOpen(false); }}
                                                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                                                    active
                                                        ? 'bg-primary/10 text-primary font-medium'
                                                        : 'text-foreground hover:bg-muted'
                                                }`}
                                            >
                                                <div className={`w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-bold flex-shrink-0 transition-colors ${
                                                    active ? 'bg-primary text-primary-foreground shadow-sm' : 'bg-muted-foreground/10 text-muted-foreground'
                                                }`}>
                                                    {opt.label.charAt(0).toUpperCase()}
                                                </div>
                                                <div className="text-left min-w-0 flex-1">
                                                    <p className="truncate">{opt.label}</p>
                                                    {opt.subtitle && (
                                                        <p className="text-xs text-muted-foreground/70 truncate mt-0.5">{opt.subtitle}</p>
                                                    )}
                                                </div>
                                                {active && <CheckCircle2 className="w-4 h-4 text-primary ml-auto flex-shrink-0" />}
                                            </button>
                                        );
                                    })
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
