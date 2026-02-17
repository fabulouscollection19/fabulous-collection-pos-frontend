import React from 'react';
import { motion } from 'framer-motion';

export const Button = ({
    children,
    variant = 'primary',
    className = '',
    loading = false,
    icon: Icon,
    ...props
}) => {
    const variants = {
        primary: 'btn-pos-primary',
        secondary: 'btn-pos-secondary',
        success: 'btn-pos-success',
        danger: 'btn-pos-danger',
        ghost: 'bg-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-900',
    };

    return (
        <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            className={`btn-pos ${variants[variant]} ${className} flex items-center gap-2`}
            disabled={loading || props.disabled}
            {...props}
        >
            {loading ? (
                <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            ) : Icon && <Icon className="w-4 h-4" />}
            {children}
        </motion.button>
    );
};

export const Card = ({ children, className = '', title, subtitle, footer, noPadding = false }) => {
    return (
        <div className={`pos-card bg-white ${className}`}>
            {(title || subtitle) && (
                <div className="px-5 py-4 border-b border-slate-100">
                    {title && <h3 className="text-lg font-semibold text-slate-900">{title}</h3>}
                    {subtitle && <p className="text-sm text-slate-500 mt-0.5">{subtitle}</p>}
                </div>
            )}
            <div className={noPadding ? '' : 'p-3 md:p-4'}>
                {children}
            </div>
            {footer && (
                <div className="px-5 py-3 bg-slate-50 border-t border-slate-100">
                    {footer}
                </div>
            )}
        </div>
    );
};

export const InputPhone = ({ label, error, ...props }) => (
    <div className="space-y-1.5">
        {label && <label>{label}</label>}
        <div className="relative">
            <input
                className={`w-full ${error ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-500/10' : ''}`}
                {...props}
            />
        </div>
        {error && <p className="text-xs font-medium text-rose-500">{error}</p>}
    </div>
);

export const Input = ({ label, error, ...props }) => (
    <div className="space-y-1.5">
        {label && <label>{label}</label>}
        <input
            className={`w-full ${error ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-500/10' : ''}`}
            {...props}
        />
        {error && <p className="text-xs font-medium text-rose-500">{error}</p>}
    </div>
);

export const Select = ({ label, options, error, ...props }) => (
    <div className="space-y-1.5">
        {label && <label>{label}</label>}
        <select
            className={`w-full ${error ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-500/10' : ''}`}
            {...props}
        >
            {options.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
        </select>
        {error && <p className="text-xs font-medium text-rose-500">{error}</p>}
    </div>
);

export const PageHeader = ({ title, subtitle, actions }) => (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{title}</h1>
            {subtitle && <p className="text-sm text-slate-500 mt-1">{subtitle}</p>}
        </div>
        {actions && <div className="flex items-center gap-3">{actions}</div>}
    </div>
);
