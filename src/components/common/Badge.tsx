import React from 'react';
import type { RiskLevel, AlertSeverity } from '../../types';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'cyan' | 'red' | 'amber' | 'green' | 'blue' | 'purple' | 'slate';
  size?: 'sm' | 'md';
  pulse?: boolean;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'cyan',
  size = 'md',
  pulse = false,
  className = '',
}) => {
  const variantStyles = {
    cyan: 'bg-cyan-500/10 text-[#35D9F5] border-[#35D9F5]/30',
    red: 'bg-red-500/10 text-red-400 border-red-500/30',
    amber: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    green: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    blue: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
    purple: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
    slate: 'bg-slate-700/30 text-slate-300 border-slate-600/40',
  };

  const sizeStyles = {
    sm: 'text-[10px] px-1.5 py-0.5 tracking-wider font-mono',
    md: 'text-xs px-2.5 py-1 tracking-wide font-mono',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded border uppercase font-medium backdrop-blur-sm ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
    >
      {pulse && (
        <span className="relative flex h-1.5 w-1.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 bg-current"></span>
          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-current"></span>
        </span>
      )}
      {children}
    </span>
  );
};

export const RiskBadge: React.FC<{ level: RiskLevel; pulse?: boolean }> = ({ level, pulse }) => {
  const map: Record<RiskLevel, { variant: 'red' | 'amber' | 'green' | 'blue' | 'purple'; label: string }> = {
    critical: { variant: 'red', label: 'CRITICAL INUNDATION' },
    high: { variant: 'red', label: 'HIGH RISK' },
    moderate: { variant: 'amber', label: 'MODERATE WATCH' },
    low: { variant: 'blue', label: 'LOW CONCERN' },
    safe: { variant: 'green', label: 'NORMAL / SAFE' },
  };

  const conf = map[level] || map.safe;
  return (
    <Badge variant={conf.variant} pulse={pulse || level === 'critical'}>
      {conf.label}
    </Badge>
  );
};

export const SeverityBadge: React.FC<{ severity: AlertSeverity }> = ({ severity }) => {
  const map: Record<AlertSeverity, { variant: 'red' | 'amber' | 'green' | 'blue'; label: string }> = {
    critical: { variant: 'red', label: 'CRITICAL' },
    high: { variant: 'amber', label: 'HIGH' },
    moderate: { variant: 'blue', label: 'MODERATE' },
    advisory: { variant: 'green', label: 'ADVISORY' },
  };

  const conf = map[severity] || map.moderate;
  return <Badge variant={conf.variant} size="sm">{conf.label}</Badge>;
};
