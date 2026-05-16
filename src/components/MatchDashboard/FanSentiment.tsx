import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Tweet } from '../../types';
import { SectionLabel, Badge } from '../common/Common';
import { Heart, MessageCircle, Repeat2, Share2, TrendingUp } from 'lucide-react';

interface FanSentimentProps {
  tweets: Tweet[];
}

export const FanSentiment: React.FC<FanSentimentProps> = ({ tweets }) => {
  return (
    <div className="glass-panel p-6 flex flex-col h-[400px] relative overflow-hidden">
       <div className="flex items-center justify-between mb-4">
         <SectionLabel>📱 Fan Sentiment Intelligence</SectionLabel>
         <TrendingUp className="w-4 h-4 text-accent-purple animate-bounce" />
       </div>

       <div className="flex-1 overflow-y-auto custom-scrollbar space-y-4 pr-2">
        <AnimatePresence initial={false}>
          {tweets.length > 0 ? (
            tweets.map((t, idx) => (
              <motion.div 
                key={t.id} 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.05 }}
                className="bg-bg-card/40 border border-border/50 p-4 rounded-2xl group hover:border-accent-purple/50 transition-all hover:bg-bg-card/60"
              >
                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-xl bg-linear-to-br from-accent-purple/20 to-accent-blue/20 flex items-center justify-center text-accent-purple font-black text-sm shrink-0 border border-white/5">
                    {t.handle[1]?.toUpperCase() || 'U'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1.5 gap-2">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px] font-bold text-white truncate">{t.handle}</span>
                        <span className="w-1 h-1 bg-white/20 rounded-full" />
                        <span className="text-[9px] text-text-muted">now</span>
                      </div>
                      <div className="flex items-center gap-1">
                        {t.sentiment === 'pos' && <span className="text-sm">😊</span>}
                        {t.sentiment === 'neg' && <span className="text-sm">😠</span>}
                        {t.sentiment === 'neu' && <span className="text-sm">😐</span>}
                      </div>
                    </div>
                    <p className="text-[11px] text-gray-300 leading-relaxed mb-3">
                      {t.text}
                    </p>
                    <div className="flex items-center justify-between text-text-muted mt-2">
                       <div className="flex items-center gap-4">
                          <div className="flex items-center gap-1 hover:text-accent-blue transition-colors cursor-pointer group/icon">
                             <MessageCircle className="w-3.5 h-3.5" />
                             <span className="text-[9px] font-mono">{Math.floor(Math.random() * 50)}</span>
                          </div>
                          <div className="flex items-center gap-1 hover:text-accent-alt transition-colors cursor-pointer group/icon">
                             <Repeat2 className="w-3.5 h-3.5" />
                             <span className="text-[9px] font-mono">{Math.floor(Math.random() * 20)}</span>
                          </div>
                          <div className="flex items-center gap-1 hover:text-danger transition-colors cursor-pointer group/icon">
                             <Heart className="w-3.5 h-3.5" />
                             <span className="text-[9px] font-mono">{Math.floor(Math.random() * 200)}</span>
                          </div>
                       </div>
                       <Share2 className="w-3 h-3 hover:text-white transition-colors cursor-pointer" />
                    </div>
                  </div>
                </div>
              </motion.div>
            ))
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-text-muted space-y-3 opacity-50">
              <div className="w-12 h-12 rounded-full border-2 border-dashed border-accent-purple/30 flex items-center justify-center animate-spin-slow">
                 <Share2 className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-mono uppercase tracking-widest">Listening to the crowd...</span>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
