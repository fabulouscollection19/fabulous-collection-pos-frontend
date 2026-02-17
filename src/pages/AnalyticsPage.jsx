import { motion } from 'framer-motion';
import { BarChart3, TrendingUp, PieChart, Activity, Sparkles, ShieldCheck, Zap } from 'lucide-react';
import { Card, PageHeader } from '../components/UIComponents';

const AnalyticsPage = () => {
  return (
    <div className="container-tablet">
      <PageHeader
        title="Intelligence Hub"
        subtitle="Harness data to optimize your retail performance"
        icon={BarChart3}
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative mt-4"
      >
        {/* Background Glow */}
        <div className="absolute -top-24 -left-24 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <Card className="relative overflow-hidden border-indigo-100/50 bg-white/80 backdrop-blur-xl p-12 lg:p-20 text-center">
          <motion.div
            animate={{
              y: [0, -10, 0],
              rotate: [0, 5, 0, -5, 0]
            }}
            transition={{
              duration: 6,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="w-24 h-24 bg-gradient-to-tr from-indigo-600 to-indigo-400 rounded-[32px] flex items-center justify-center mx-auto mb-10 shadow-2xl shadow-indigo-600/30"
          >
            <Sparkles className="w-12 h-12 text-white" />
          </motion.div>

          <h3 className="text-4xl lg:text-5xl font-black text-slate-900 mb-6 tracking-tight">
            Advanced Analytics <br />
            <span className="text-indigo-600">Coming Soon.</span>
          </h3>

          <p className="text-lg text-slate-500 mb-12 max-w-2xl mx-auto font-medium leading-relaxed">
            We're engineering a state-of-the-art intelligence layer that will provide
            unmatched insights into your inventory velocity and customer demographics.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {[
              {
                icon: TrendingUp,
                title: "Sales Velocity",
                desc: "Identify peak performance periods with AI predictive modeling.",
                color: "text-indigo-600",
                bg: "bg-indigo-50"
              },
              {
                icon: PieChart,
                title: "Margin Analysis",
                desc: "Real-time profitability tracking across all product categories.",
                color: "text-emerald-600",
                bg: "bg-emerald-50"
              },
              {
                icon: ShieldCheck,
                title: "Audit Intelligence",
                desc: "Automated stock discrepancy detection and loss prevention.",
                color: "text-rose-600",
                bg: "bg-rose-50"
              }
            ].map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + (i * 0.1) }}
                className="p-6 rounded-3xl border border-slate-100 bg-white shadow-sm hover:shadow-md transition-shadow group"
              >
                <div className={`w-12 h-12 ${feature.bg} ${feature.color} rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform`}>
                  <feature.icon className="w-6 h-6" />
                </div>
                <h4 className="font-bold text-slate-900 mb-2">{feature.title}</h4>
                <p className="text-xs text-slate-400 font-medium leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </div>

          <div className="mt-16 inline-flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-full text-xs font-black uppercase tracking-widest">
            <Zap className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
            Priority Access Pending
          </div>
        </Card>
      </motion.div>
    </div>
  );
};

export default AnalyticsPage;
