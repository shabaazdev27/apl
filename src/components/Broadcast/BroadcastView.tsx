import React from 'react';
import { motion } from 'framer-motion';
import { Globe, MonitorPlay, RefreshCw, Cpu, Activity, MessageSquare, Trophy } from 'lucide-react';
import { SectionLabel } from '../common/Common';

interface BroadcastViewProps {
  setModalContent: (content: { title: string; body: string }) => void;
}

export const BroadcastView: React.FC<BroadcastViewProps> = ({ setModalContent }) => {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-4">
       <div className="glass-panel p-10">
          <SectionLabel>Global Distribution Network</SectionLabel>
          <div className="grid lg:grid-cols-2 gap-12 mt-8">
             <div className="space-y-8">
                 <div className="flex gap-6">
                    <div className="w-16 h-16 bg-accent/10 rounded-2xl flex items-center justify-center text-accent shrink-0 border border-accent/20">
                       <Globe className="w-8 h-8" />
                    </div>
                    <div>
                       <h4 className="font-head font-bold text-xl mb-1">Edge Rendering</h4>
                       <p className="text-sm text-text-muted leading-relaxed">Dashboard rendering at the network edge.</p>
                    </div>
                 </div>
                 <div className="flex gap-6">
                    <div className="w-16 h-16 bg-accent-blue/10 rounded-2xl flex items-center justify-center text-accent-blue shrink-0 border border-accent-blue/20">
                       <MonitorPlay className="w-8 h-8" />
                    </div>
                    <div>
                       <h4 className="font-head font-bold text-xl mb-1">Multi-Lang TTS</h4>
                       <p className="text-sm text-text-muted leading-relaxed">Real-time localized audio generation.</p>
                    </div>
                 </div>
             </div>
             <div className="bg-bg-card rounded-3xl border border-border p-8 flex flex-col items-center justify-center min-h-[300px] relative overflow-hidden group">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,229,160,0.05)_0%,transparent_70%)] animate-pulse" />
                <div className="text-center relative z-10">
                   <RefreshCw className="w-12 h-12 text-accent mx-auto mb-4 animate-spin opacity-20" />
                   <p className="font-mono text-xs text-text-muted uppercase tracking-[0.3em] mb-4">Awaiting Video Source...</p>
                   <div className="flex gap-1.5 justify-center">
                      {[1,2,3,4,5,6,7,8].map(i => (
                        <motion.div key={i} animate={{ height: [10, 30, 10] }} transition={{ repeat: Infinity, duration: 1, delay: i * 0.1 }} className="w-1 bg-accent/20 rounded-full" />
                      ))}
                   </div>
                </div>
             </div>
          </div>
       </div>

       <section className="bg-linear-to-br from-accent/5 to-accent-purple/5 border border-border-alt rounded-3xl p-12 text-center mt-12">
          <h3 className="text-3xl font-head font-black mb-4">Production-Ready Intelligence</h3>
          <p className="text-text-muted text-lg font-light mb-10">Deploy this autonomous stack to Cloud Run & Vertex AI.</p>
          
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 text-left">
            {[
              { title: 'Data Ingestion Layer', icon: Globe, desc: 'Google Pub/Sub + Cloud Dataflow pipeline for sub-50ms event latency.' },
              { title: 'Agent Orchestration', icon: Cpu, desc: 'Parallel execution of 9 agents hosted on Cloud Run.' },
              { title: 'Broadcast Engine', icon: MonitorPlay, desc: 'Global distribution to 200+ CDN nodes.' },
              { title: 'ML Prediction Stack', icon: Activity, desc: 'Vertex AI pipeline running Bayesian & LSTM models.' },
              { title: 'Sentiment Hub', icon: MessageSquare, desc: 'Social firehose processing for real-time crowd mood.' },
              { title: 'Fantasy Strategy', icon: Trophy, desc: 'Dynamic Dream XI points optimizer.' },
            ].map((item, idx) => (
              <div key={idx} className="bg-bg-alt/50 border border-border p-6 rounded-2xl cursor-pointer hover:border-accent transition-all group" onClick={() => setModalContent({ title: item.title, body: item.desc })}>
                <div className="w-10 h-10 bg-accent/10 border border-accent/20 rounded-xl flex items-center justify-center text-accent group-hover:scale-110 transition-transform mb-4">
                  <item.icon className="w-5 h-5" />
                </div>
                <h4 className="font-head font-bold mb-2">{item.title}</h4>
                <p className="text-xs text-text-muted leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>
    </div>
  );
};
