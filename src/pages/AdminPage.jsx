import { motion } from 'framer-motion';
import { Settings, Users, Shield, Database, Lock, Terminal, Fingerprint } from 'lucide-react';
import { Card, PageHeader } from '../components/UIComponents';

const AdminPage = () => {
  return (
    <div className="container-tablet">
      <PageHeader
        title="Command Centre"
        subtitle="Manage system permissions and administrative protocols"
        icon={Settings}
      />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative mt-4"
      >
        {/* Aesthetic accents */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-rose-500/5 rounded-full blur-[120px] pointer-events-none" />

        <Card className="relative overflow-hidden border-rose-100/50 bg-white/80 backdrop-blur-xl p-12 lg:p-20 text-center">
          <motion.div
            initial={{ scale: 0.8, rotate: -10 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{
              type: "spring",
              stiffness: 260,
              damping: 20
            }}
            className="w-24 h-24 bg-gradient-to-tr from-rose-600 to-rose-400 rounded-[32px] flex items-center justify-center mx-auto mb-10 shadow-2xl shadow-rose-600/30"
          >
            <Lock className="w-12 h-12 text-white" />
          </motion.div>

          <h3 className="text-4xl lg:text-5xl font-black text-slate-900 mb-6 tracking-tight">
            Administrative Control <br />
            <span className="text-rose-600">Restricted Access.</span>
          </h3>

          <p className="text-lg text-slate-500 mb-12 max-w-2xl mx-auto font-medium leading-relaxed">
            The administrative suite is currently under rigorous security calibration.
            Advanced user auditing and system-wide overrides will be available in the next release.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {[
              {
                icon: Users,
                title: "RBAC Controls",
                desc: "Granular role-based access control for every staff member.",
                color: "text-blue-600",
                bg: "bg-blue-50"
              },
              {
                icon: Shield,
                title: "Security Hardening",
                desc: "Enterprise-grade encryption and session management tools.",
                color: "text-emerald-600",
                bg: "bg-emerald-50"
              },
              {
                icon: Terminal,
                title: "System Logs",
                desc: "Immutable audit trails for every transaction and inventory change.",
                color: "text-amber-600",
                bg: "bg-amber-50"
              }
            ].map((feature, i) => (
              <div
                key={i}
                className="p-6 rounded-3xl border border-slate-100 bg-white shadow-sm hover:border-rose-200 transition-colors group"
              >
                <div className={`w-12 h-12 ${feature.bg} ${feature.color} rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:rotate-12 transition-transform`}>
                  <feature.icon className="w-6 h-6" />
                </div>
                <h4 className="font-bold text-slate-900 mb-2">{feature.title}</h4>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>

          <div className="mt-16 flex items-center justify-center gap-3">
            <div className="flex -space-x-2">
              {[1, 2, 3].map(i => (
                <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-slate-200" />
              ))}
            </div>
            <p className="text-xs text-slate-400 font-bold">Encrypted Connection Established</p>
            <Fingerprint className="w-4 h-4 text-emerald-500" />
          </div>
        </Card>
      </motion.div>
    </div>
  );
};

export default AdminPage;
