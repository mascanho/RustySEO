"use client";

import { motion } from "framer-motion";
import { MapPin } from "lucide-react";

export function GeographicalDistributionChart({ data }: { data: any[] }) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground text-xs italic">
        No geographical data available
      </div>
    );
  }

  // Calculate total sessions for percentage
  const totalSessions = data.reduce((sum, item) => sum + item.sessions, 0);

  // Get top 8 countries
  const topCountries = data.slice(0, 8);

  return (
    <div className="w-full h-full space-y-3">
      {topCountries.map((country, index) => {
        const percentage = ((country.sessions / totalSessions) * 100).toFixed(1);

        return (
          <motion.div
            key={country.name}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
            className="group relative"
          >
            {/* Country Info Row */}
            <div className="flex items-center justify-between mb-1.5 px-1">
              <div className="flex items-center gap-2">
                <MapPin className="w-3 h-3 text-brand-bright opacity-60" />
                <span className="text-xs font-black uppercase tracking-tight text-slate-800 dark:text-slate-200">
                  {country.name}
                </span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-xs font-black tabular-nums text-slate-900 dark:text-white">
                  {country.sessions.toLocaleString()}
                </span>
                <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500">
                  {percentage}%
                </span>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="relative h-2 bg-slate-100 dark:bg-brand-dark rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${percentage}%` }}
                transition={{
                  duration: 0.8,
                  delay: 0.2 + index * 0.05,
                  ease: [0.23, 1, 0.32, 1]
                }}
                className="absolute inset-y-0 left-0 bg-gradient-to-r from-brand-bright to-blue-400 rounded-full shadow-[0_0_8px_rgba(43,108,196,0.4)]"
              />

              {/* Shimmer effect on hover */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 translate-x-[-100%] group-hover:translate-x-[100%] group-hover:transition-transform group-hover:duration-1000" />
            </div>
          </motion.div>
        );
      })}

      {/* Summary footer */}
      {data.length > 8 && (
        <div className="pt-3 mt-3 border-t border-slate-200 dark:border-brand-dark">
          <p className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest text-center">
            +{data.length - 8} more countries • {totalSessions.toLocaleString()} total sessions
          </p>
        </div>
      )}
    </div>
  );
}
