'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  TrendingUp, BarChart3, Activity, Zap, Shield, Target,
  ArrowRight, Play, LineChart, Brain, Clock, Layers
} from 'lucide-react';

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.6, ease: 'easeOut' },
  }),
};

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#131722] text-[#d1d4dc] overflow-x-hidden">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#131722]/90 backdrop-blur-md border-b border-[#2B2B43]">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded bg-[#2962ff] flex items-center justify-center">
              <LineChart size={18} className="text-white" />
            </div>
            <span className="text-lg font-bold text-white">TradeSim</span>
          </div>
          <div className="flex items-center gap-6 text-sm text-[#787b86]">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-white transition-colors">How it Works</a>
            <Link href="/login" className="hover:text-white transition-colors">Login</Link>
            <Link
              href="/register"
              className="btn btn-primary text-sm !py-1.5 !px-4"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-32 pb-24 px-6">
        {/* Background effects */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-1/4 w-96 h-96 bg-[#2962ff]/5 rounded-full blur-[120px]" />
          <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-[#26a69a]/5 rounded-full blur-[100px]" />
          {/* Grid */}
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: 'linear-gradient(#2B2B43 1px, transparent 1px), linear-gradient(90deg, #2B2B43 1px, transparent 1px)',
              backgroundSize: '60px 60px',
            }}
          />
        </div>

        <div className="relative max-w-5xl mx-auto text-center">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            custom={0}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#2962ff]/10 border border-[#2962ff]/20 text-[#2962ff] text-xs font-medium mb-8"
          >
            <Zap size={12} />
            Professional-Grade Backtesting
          </motion.div>

          <motion.h1
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            custom={1}
            className="text-5xl md:text-7xl font-bold text-white leading-tight mb-6"
          >
            Test Your Strategies
            <br />
            <span className="bg-gradient-to-r from-[#2962ff] to-[#26a69a] bg-clip-text text-transparent">
              Before Going Live
            </span>
          </motion.h1>

          <motion.p
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            custom={2}
            className="text-lg text-[#787b86] max-w-2xl mx-auto mb-10 leading-relaxed"
          >
            TradingView-powered charts, professional indicators, and a full backtesting engine.
            Validate your edge with historical data — no risk, no guesswork.
          </motion.p>

          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            custom={3}
            className="flex items-center justify-center gap-4"
          >
            <Link href="/register" className="btn btn-primary !py-3 !px-8 !text-base">
              Start Backtesting
              <ArrowRight size={16} />
            </Link>
            <a href="#features" className="btn btn-ghost !py-3 !px-8 !text-base">
              <Play size={14} />
              See Features
            </a>
          </motion.div>

          {/* Chart preview mockup */}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            custom={4}
            className="mt-16 relative"
          >
            <div className="card glow-blue overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-2 border-b border-[#2B2B43]">
                <div className="w-3 h-3 rounded-full bg-[#ef5350]" />
                <div className="w-3 h-3 rounded-full bg-[#ff9800]" />
                <div className="w-3 h-3 rounded-full bg-[#26a69a]" />
                <span className="ml-3 text-xs text-[#787b86]">EURUSD · 1H · TradeSim</span>
              </div>
              <div className="h-64 bg-[#131722] flex items-end justify-center gap-[2px] px-4 py-4">
                {Array.from({ length: 80 }, (_, i) => {
                  const h = 30 + Math.sin(i * 0.3) * 20 + Math.random() * 30;
                  const isUp = Math.sin(i * 0.2) > -0.3;
                  return (
                    <div
                      key={i}
                      className="flex-1 rounded-sm"
                      style={{
                        height: `${h}%`,
                        backgroundColor: isUp ? '#26a69a' : '#ef5350',
                        opacity: 0.6 + Math.random() * 0.4,
                      }}
                    />
                  );
                })}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            custom={0}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Everything You Need to Backtest
            </h2>
            <p className="text-[#787b86] max-w-xl mx-auto">
              Professional tools for serious traders. No compromises.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: <BarChart3 size={24} />,
                title: 'TradingView Charts',
                desc: 'Candlestick, line, and area charts with full interactivity — zoom, pan, crosshair.',
                color: '#2962ff',
              },
              {
                icon: <Activity size={24} />,
                title: 'Technical Indicators',
                desc: 'SMA, EMA, RSI, MACD, Bollinger Bands. Overlay on chart or separate panes.',
                color: '#26a69a',
              },
              {
                icon: <Target size={24} />,
                title: 'Strategy Engine',
                desc: 'MA Crossover, RSI Reversal. Configurable SL/TP, position sizing, and more.',
                color: '#ef5350',
              },
              {
                icon: <Clock size={24} />,
                title: 'Replay Mode',
                desc: 'Replay market data bar-by-bar. See exactly how your strategy would perform.',
                color: '#ff9800',
              },
              {
                icon: <Brain size={24} />,
                title: 'Smart Analysis',
                desc: 'Win rate, Sharpe ratio, max drawdown, profit factor — all calculated automatically.',
                color: '#9c27b0',
              },
              {
                icon: <Layers size={24} />,
                title: 'Multi-Asset',
                desc: 'Forex, Crypto, Stocks, Commodities. 10+ symbols with realistic price data.',
                color: '#00bcd4',
              },
            ].map((f, i) => (
              <motion.div
                key={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                custom={i}
                className="card group hover:border-opacity-50 transition-all duration-300"
                style={{ borderColor: `${f.color}20` }}
              >
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center mb-4"
                  style={{ backgroundColor: `${f.color}15`, color: f.color }}
                >
                  {f.icon}
                </div>
                <h3 className="text-white font-semibold mb-2">{f.title}</h3>
                <p className="text-sm text-[#787b86] leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="py-24 px-6 bg-[#1e222d]/50">
        <div className="max-w-4xl mx-auto">
          <motion.h2
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            custom={0}
            className="text-3xl font-bold text-white text-center mb-16"
          >
            Three Steps to Validate Your Edge
          </motion.h2>

          <div className="space-y-8">
            {[
              { step: '01', title: 'Create a Session', desc: 'Choose a symbol, timeframe, and initial balance. Your backtest workspace is ready in seconds.' },
              { step: '02', title: 'Configure Strategy', desc: 'Set your indicators, entry/exit rules, stop loss, and take profit levels.' },
              { step: '03', title: 'Run & Analyze', desc: 'Execute the backtest and review detailed results — equity curve, trade list, and performance metrics.' },
            ].map((s, i) => (
              <motion.div
                key={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                custom={i}
                className="flex gap-6 items-start"
              >
                <div className="text-4xl font-bold text-[#2962ff]/30 shrink-0 w-16">{s.step}</div>
                <div>
                  <h3 className="text-xl font-semibold text-white mb-2">{s.title}</h3>
                  <p className="text-[#787b86]">{s.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            custom={0}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Ready to Find Your Edge?
            </h2>
            <p className="text-[#787b86] mb-8">
              Start backtesting your strategies today. Free, fast, no credit card required.
            </p>
            <Link href="/register" className="btn btn-primary !py-3 !px-10 !text-base">
              Create Free Account
              <ArrowRight size={16} />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#2B2B43] py-8 px-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between text-sm text-[#787b86]">
          <div className="flex items-center gap-2">
            <LineChart size={14} />
            <span>TradeSim</span>
          </div>
          <span>© 2026 TradeSim. All rights reserved.</span>
        </div>
      </footer>
    </div>
  );
}
