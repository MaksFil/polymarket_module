'use client'

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import NumberFlow from "@number-flow/react";
import { getPnL } from "@/app/dashboard/actions/getPNL";
import { line, curveMonotoneX } from "d3-shape";

const TIMEFRAMES = ["1H","6H","1D","1W","1M","All"] as const;

export default function PnlCard() {
  const [timeframe, setTimeframe] = useState<typeof TIMEFRAMES[number]>('1D');
  const [pnl, setPnl] = useState<PnlResponse | null>(null);
  const [hoveredValue, setHoveredValue] = useState<number | null>(null);
  const [hoveredDate, setHoveredDate] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  // ===== Fetch PnL on timeframe change =====
  useEffect(() => {
    const fetchPnL = async () => {
      try {
        const data = await getPnL(timeframe);
        setPnl(data);

        // Set default hovered values to last point
        const lastValue = data?.data?.graph?.length
          ? data.data.graph[data.data.graph.length - 1].value
          : 0;
        const lastDate = data?.data?.graph?.length
          ? data.data.graph[data.data.graph.length - 1].timestamp
          : Math.floor(Date.now() / 1000);

        setHoveredValue(lastValue);
        setHoveredDate(lastDate);

      } catch (err) {
        console.error("PnL fetch error:", err);
      }
    };
    fetchPnL();
  }, [timeframe]);

  const displayValue = hoveredValue ?? pnl?.data?.current ?? 0;

  const graph = pnl?.data?.graph && pnl.data.graph.length
    ? pnl.data.graph
    : [{ timestamp: Math.floor(Date.now()/1000), value: 0 }];

  // ===== Generate smooth path with top/bottom padding =====
  const generateSmoothPath = (points: PnlPoint[], width: number, height: number) => {
    if (!points || !points.length) return `M0 ${height/2} L${width} ${height/2}`;

    const values = points.map(p => p.value);
    let min = Math.min(...values);
    let max = Math.max(...values);

    const totalPad = (max - min) * 0.15 || 1;
    max = max + totalPad * 0.7;
    min = min - totalPad * 0.3;

    const yScale = (val: number) =>
      height - ((val - min) / (max - min)) * height;
    const xScale = (idx: number) =>
      points.length === 1 ? width / 2 : (idx / (points.length - 1)) * width;

    const pathGenerator = line<PnlPoint>()
      .x((_: PnlPoint, i: number) => xScale(i))  
      .y((d: PnlPoint) => yScale(d.value)) 
      .curve(curveMonotoneX);

    return pathGenerator(points) ?? "";
  };

  // ===== Update hovered values on mouse move =====
  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement, MouseEvent>) => {
    if (!graph || !graph.length) return;
    const svg = e.currentTarget;
    const { left, width } = svg.getBoundingClientRect();
    const mouseX = e.clientX - left;

    const idx = Math.round((mouseX / width) * (graph.length - 1));
    const clampedIdx = Math.max(0, Math.min(graph.length - 1, idx));
    const point = graph[clampedIdx];

    setHoveredValue(point.value);
    setHoveredDate(point.timestamp);
  };

  return (
    <div className="w-[639px] h-[236px] bg-white rounded-[8px] border border-gray-200 shadow-[0_10px_45px_rgba(0,0,0,0.08)] p-5 flex flex-col">

      {/* Header */}
      <div className="flex justify-between items-start h-[92px]">
        <div className="flex flex-col gap-[4px]">
          {/* Label and download */}
          <p className="text-sm text-gray-500 flex items-center gap-2">
            <span className={displayValue >= 0 ? 'text-green-500' : 'text-red-500'}>
              {displayValue >= 0 ? '▲' : '▼'}
            </span>
            Profit/Loss
            <motion.img
              src="/icon/download-pnl.png"
              alt="Download PnL"
              className="w-4 h-4 cursor-pointer select-none"
              whileHover={{ scale: 1.15 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => {
                if (!graph) return;

                // Prepare CSV content
                const csvContent = [
                  ["time", "value"],
                  ...graph.map(p => [
                    new Date(p.timestamp * 1000).toLocaleString(),
                    p.value
                  ])
                ]
                  .map(e => e.join(";"))
                  .join("\n");

                const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
                const url = URL.createObjectURL(blob);

                const link = document.createElement("a");
                link.href = url;
                link.setAttribute("download", `pnl_${timeframe}.csv`);
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);

                URL.revokeObjectURL(url);
              }}
            />
          </p>

          {/* Current value */}
          <div
            className="text-[40px] font-normal leading-[100%] tracking-[-0.02em] text-black"
            style={{ fontFamily: "'Euclid Circular A', sans-serif" }}
          >
            {displayValue >= 0 ? "+" : "-"}$
            <NumberFlow
              value={Math.abs(displayValue)}
              format={{ minimumFractionDigits: 2, maximumFractionDigits: 2 }}
            />
          </div>

          {/* Timeframe info */}
          <p className="text-xs text-gray-500 font-bold -mt-1">
            Past {timeframe}
            {hoveredDate ? ` — ${new Date(hoveredDate * 1000).toLocaleString()}` : ""}
          </p>
        </div>

        {/* Timeframe buttons */}
        <div className="flex gap-1 text-xs text-gray-500 pt-1">
          {TIMEFRAMES.map(tf => (
            <motion.span
              key={tf}
              whileHover={{ scale: 1.1 }}
              className={`
                cursor-pointer px-3 py-1 rounded-md transition-colors
                ${tf === timeframe 
                  ? "bg-[#FF6A00]/20 text-[#FF6A00] font-medium shadow-[0_2px_6px_rgba(255,106,0,0.3)]"
                  : "hover:bg-gray-100"}
              `}
              onClick={() => setTimeframe(tf)}
            >
              {tf}
            </motion.span>
          ))}
        </div>
      </div>

      {/* Chart */}
      <div className="mt-2 flex-1 w-full relative overflow-hidden">
        <svg
          ref={svgRef}
          className="w-full h-full"
          onMouseMove={handleMouseMove}
          onMouseLeave={() => { setHoveredValue(null); setHoveredDate(null); }}
        >
          {/* Gradient fill */}
          <defs>
            <linearGradient id="pnlGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#FF6A00" stopOpacity={0.3} />
              <stop offset="100%" stopColor="#FF6A00" stopOpacity={0} />
            </linearGradient>
          </defs>

          {/* Generate path */}
          {svgRef.current && (() => {
            const width = svgRef.current!.clientWidth;
            const height = svgRef.current!.clientHeight;
            const path = generateSmoothPath(graph, width, height);

            return (
              <>
                {/* Line */}
                <motion.path
                  d={path}
                  fill="none"
                  stroke="#FF6A00"
                  strokeWidth={2}
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 0.8 }}
                />
                {/* Fill area */}
                <path
                  d={`${path} L ${width} ${height} L 0 ${height} Z`}
                  fill="url(#pnlGradient)"
                />
              </>
            )
          })()}
        </svg>
      </div>
    </div>
  );
}
