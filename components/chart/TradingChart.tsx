'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import {
  createChart,
  type IChartApi,
  type ISeriesApi,
  type CandlestickData,
  type Time,
  type SeriesType,
  ColorType,
  CrosshairMode,
} from 'lightweight-charts';
import type { Candle, Trade } from '@/types';
import { calculateSMA, calculateEMA, calculateBollingerBands, calculateRSI } from '@/lib/indicators';

interface TradingChartProps {
  candles: Candle[];
  trades?: Trade[];
  indicators?: {
    sma?: number[];
    ema?: number[];
    bollinger?: boolean;
  };
  replayMode?: boolean;
  replayIndex?: number;
  height?: number;
}

export default function TradingChart({
  candles,
  trades = [],
  indicators = {},
  replayMode = false,
  replayIndex = 0,
  height = 500,
}: TradingChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candleSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<'Histogram'> | null>(null);
  const indicatorSeriesRef = useRef<Map<string, ISeriesApi<SeriesType>>>(new Map());
  const [chartReady, setChartReady] = useState(false);

  // Initialize chart
  useEffect(() => {
    if (!containerRef.current || chartRef.current) return;

    const chart = createChart(containerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: '#131722' },
        textColor: '#d1d4dc',
        fontSize: 12,
      },
      grid: {
        vertLines: { color: '#1e222d' },
        horzLines: { color: '#1e222d' },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: { color: '#758696', width: 1, style: 0 },
        horzLine: { color: '#758696', width: 1, style: 0 },
      },
      rightPriceScale: {
        borderColor: '#2B2B43',
        scaleMargins: { top: 0.1, bottom: 0.2 },
      },
      timeScale: {
        borderColor: '#2B2B43',
        timeVisible: true,
        secondsVisible: false,
      },
      width: containerRef.current.clientWidth,
      height,
    });

    // Candlestick series
    const candleSeries = chart.addCandlestickSeries({
      upColor: '#26a69a',
      downColor: '#ef5350',
      borderUpColor: '#26a69a',
      borderDownColor: '#ef5350',
      wickUpColor: '#26a69a',
      wickDownColor: '#ef5350',
    });

    // Volume series
    const volumeSeries = chart.addHistogramSeries({
      priceFormat: { type: 'volume' },
      priceScaleId: 'volume',
    });
    chart.priceScale('volume').applyOptions({
      scaleMargins: { top: 0.85, bottom: 0 },
    });

    chartRef.current = chart;
    candleSeriesRef.current = candleSeries;
    volumeSeriesRef.current = volumeSeries;
    setChartReady(true);

    // Resize handler
    const handleResize = () => {
      if (containerRef.current && chartRef.current) {
        chartRef.current.applyOptions({ width: containerRef.current.clientWidth });
      }
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
        candleSeriesRef.current = null;
        volumeSeriesRef.current = null;
        indicatorSeriesRef.current.clear();
        setChartReady(false);
      }
    };
  }, [height]);

  // Update data — CRITICAL: use setData for first 2 bars, then update() for replay
  useEffect(() => {
    if (!chartReady || !candleSeriesRef.current || candles.length === 0) return;

    const chartData: CandlestickData<Time>[] = candles.map(c => ({
      time: c.time as Time,
      open: c.open,
      high: c.high,
      low: c.low,
      close: c.close,
    }));

    const volData = candles.map(c => ({
      time: c.time as Time,
      value: c.volume,
      color: c.close >= c.open ? 'rgba(38, 166, 154, 0.3)' : 'rgba(239, 83, 80, 0.3)',
    }));

    if (replayMode) {
      // REPLAY MODE: setData for first 2 bars, then update() for each subsequent
      if (replayIndex <= 1) {
        candleSeriesRef.current.setData(chartData.slice(0, 2));
        if (volumeSeriesRef.current) {
          volumeSeriesRef.current.setData(volData.slice(0, 2));
        }
      } else {
        const visibleData = chartData.slice(0, replayIndex + 1);
        candleSeriesRef.current.setData(visibleData);
        if (volumeSeriesRef.current) {
          volumeSeriesRef.current.setData(volData.slice(0, replayIndex + 1));
        }
      }
    } else {
      // NORMAL MODE: setData with all data
      candleSeriesRef.current.setData(chartData);
      if (volumeSeriesRef.current) {
        volumeSeriesRef.current.setData(volData);
      }
      chartRef.current?.timeScale().fitContent();
    }
  }, [candles, chartReady, replayMode, replayIndex]);

  // Update indicators
  useEffect(() => {
    if (!chartReady || !chartRef.current || candles.length === 0) return;

    // Remove old indicator series
    indicatorSeriesRef.current.forEach((series) => {
      try { chartRef.current?.removeSeries(series); } catch {}
    });
    indicatorSeriesRef.current.clear();

    // SMA
    if (indicators.sma) {
      for (const period of indicators.sma) {
        const smaData = calculateSMA(candles, period);
        const series = chartRef.current!.addLineSeries({
          color: period <= 10 ? '#ff9800' : period <= 30 ? '#2962ff' : '#9c27b0',
          lineWidth: 1,
          title: `SMA ${period}`,
        });
        const lineData = smaData.map((v, i) => v !== null ? { time: candles[i].time as Time, value: v } : null).filter(Boolean) as { time: Time; value: number }[];
        series.setData(lineData);
        indicatorSeriesRef.current.set(`sma_${period}`, series);
      }
    }

    // EMA
    if (indicators.ema) {
      for (const period of indicators.ema) {
        const emaData = calculateEMA(candles, period);
        const series = chartRef.current!.addLineSeries({
          color: period <= 10 ? '#00bcd4' : '#e91e63',
          lineWidth: 1,
          title: `EMA ${period}`,
        });
        const lineData = emaData.map((v, i) => v !== null ? { time: candles[i].time as Time, value: v } : null).filter(Boolean) as { time: Time; value: number }[];
        series.setData(lineData);
        indicatorSeriesRef.current.set(`ema_${period}`, series);
      }
    }

    // Bollinger Bands
    if (indicators.bollinger) {
      const bb = calculateBollingerBands(candles, 20, 2);
      const makeLine = (data: (number | null)[], color: string, title: string) => {
        const series = chartRef.current!.addLineSeries({ color, lineWidth: 1, title });
        const lineData = data.map((v, i) => v !== null ? { time: candles[i].time as Time, value: v } : null).filter(Boolean) as { time: Time; value: number }[];
        series.setData(lineData);
        return series;
      };
      indicatorSeriesRef.current.set('bb_upper', makeLine(bb.upper, 'rgba(41, 98, 255, 0.5)', 'BB Upper'));
      indicatorSeriesRef.current.set('bb_middle', makeLine(bb.middle, 'rgba(41, 98, 255, 0.3)', 'BB Middle'));
      indicatorSeriesRef.current.set('bb_lower', makeLine(bb.lower, 'rgba(41, 98, 255, 0.5)', 'BB Lower'));
    }
  }, [candles, indicators, chartReady]);

  return (
    <div
      ref={containerRef}
      className="w-full rounded-lg overflow-hidden"
      style={{ height }}
    />
  );
}
