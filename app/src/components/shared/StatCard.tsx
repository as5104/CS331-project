import { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: number | string;
  suffix?: string;
  icon: React.ElementType;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  color: 'blue' | 'green' | 'purple' | 'amber' | 'red' | 'emerald';
  delay?: number;
  isPercentage?: boolean;
}

const colorVariants = {
  blue: 'from-blue-500 to-blue-600 bg-blue-50 text-blue-600',
  green: 'from-green-500 to-green-600 bg-green-50 text-green-600',
  purple: 'from-purple-500 to-purple-600 bg-purple-50 text-purple-600',
  amber: 'from-amber-500 to-amber-600 bg-amber-50 text-amber-600',
  red: 'from-red-500 to-red-600 bg-red-50 text-red-600',
  emerald: 'from-emerald-500 to-emerald-600 bg-emerald-50 text-emerald-600',
};

export function StatCard({
  title,
  value,
  suffix = '',
  icon: Icon,
  trend,
  trendValue,
  color,
  delay = 0,
  isPercentage = false,
}: StatCardProps) {
  const [displayValue, setDisplayValue] = useState(0);
  const [hasAnimated, setHasAnimated] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const numericValue = typeof value === 'string' ? parseFloat(value) : value;
  const isNumeric = !isNaN(numericValue);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !hasAnimated && isNumeric) {
            setHasAnimated(true);
            const duration = 1000;
            const steps = 60;
            const increment = numericValue / steps;
            let current = 0;
            const timer = setInterval(() => {
              current += increment;
              if (current >= numericValue) {
                setDisplayValue(numericValue);
                clearInterval(timer);
              } else {
                setDisplayValue(current);
              }
            }, duration / steps);
          }
        });
      },
      { threshold: 0.1 }
    );

    if (cardRef.current) {
      observer.observe(cardRef.current);
    }

    return () => observer.disconnect();
  }, [numericValue, hasAnimated, isNumeric]);

  const formatValue = (val: number) => {
    if (isPercentage) {
      return val.toFixed(1);
    }
    if (val >= 1000) {
      return val.toLocaleString('en-US', { maximumFractionDigits: 0 });
    }
    return val.toFixed(val % 1 === 0 ? 0 : 1);
  };

  const displayString = isNumeric 
    ? formatValue(hasAnimated ? numericValue : displayValue)
    : value;

  return (
    <motion.div
      ref={cardRef}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: [0.4, 0, 0.2, 1] }}
      whileHover={{ y: -2, transition: { duration: 0.2 } }}
      className="bg-card rounded-xl p-5 border border-border card-shadow hover:card-shadow-hover transition-shadow duration-200"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm text-muted-foreground mb-1">{title}</p>
          <div className="flex items-baseline gap-1">
            <h3 className="text-2xl font-bold text-foreground">
              {displayString}
              {suffix && <span className="text-lg">{suffix}</span>}
            </h3>
          </div>
          
          {trend && (
            <div className="flex items-center gap-1 mt-2">
              {trend === 'up' && (
                <span className="flex items-center gap-1 text-xs text-green-600">
                  <TrendingUp className="w-3 h-3" />
                  {trendValue}
                </span>
              )}
              {trend === 'down' && (
                <span className="flex items-center gap-1 text-xs text-red-600">
                  <TrendingDown className="w-3 h-3" />
                  {trendValue}
                </span>
              )}
              {trend === 'neutral' && (
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Minus className="w-3 h-3" />
                  {trendValue}
                </span>
              )}
            </div>
          )}
        </div>
        
        <div className={`
          w-12 h-12 rounded-xl bg-gradient-to-br ${colorVariants[color].split(' ').slice(0, 2).join(' ')}
          flex items-center justify-center shadow-sm
        `}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
      
      {/* Progress bar for percentage values */}
      {isPercentage && isNumeric && (
        <div className="mt-4">
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: hasAnimated ? `${numericValue}%` : 0 }}
              transition={{ duration: 1, delay: delay + 0.2 }}
              className={`h-full rounded-full bg-gradient-to-r ${colorVariants[color].split(' ').slice(0, 2).join(' ')}`}
            />
          </div>
        </div>
      )}
    </motion.div>
  );
}
