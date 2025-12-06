import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { PrayerDay, PRAYER_NAMES } from '../types';

interface PrayerHeatmapProps {
  history: PrayerDay[];
}

export const PrayerHeatmap: React.FC<PrayerHeatmapProps> = ({ history }) => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current) return;
    d3.select(svgRef.current).selectAll("*").remove();

    const container = svgRef.current.parentElement;
    if (!container) return;

    const width = container.clientWidth;
    const height = 180;
    const margin = { top: 20, right: 10, bottom: 25, left: 45 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const svg = d3.select(svgRef.current)
      .attr("height", height)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    const days = Array.from({ length: 14 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (13 - i));
      const dateStr = d.toISOString().split('T')[0];
      const record = history.find(h => h.date === dateStr);
      return { date: d, dateStr, prayers: record ? record.completed : [] };
    });

    const x = d3.scaleBand()
      .range([0, innerWidth])
      .domain(days.map(d => d.dateStr))
      .padding(0.15);

    const y = d3.scaleBand()
      .range([0, innerHeight])
      .domain(PRAYER_NAMES)
      .padding(0.15);

    // X Axis
    svg.append("g")
      .attr("transform", `translate(0,${innerHeight})`)
      .call(d3.axisBottom(x).tickFormat(d => {
        const date = new Date(d as string);
        return `${date.getMonth() + 1}/${date.getDate()}`;
      }))
      .select(".domain").remove();
    svg.selectAll(".tick line").remove();
    svg.selectAll(".tick text").attr("font-size", "10px").attr("fill", "#7a829e");

    // Y Axis
    svg.append("g")
      .call(d3.axisLeft(y).tickSize(0))
      .select(".domain").remove();
    svg.selectAll(".tick text").attr("font-size", "11px").attr("fill", "#c0caf5").attr("font-family", "Roboto Mono");

    // Heatmap cells
    days.forEach(day => {
      PRAYER_NAMES.forEach(prayer => {
        svg.append("rect")
          .attr("x", x(day.dateStr)!)
          .attr("y", y(prayer)!)
          .attr("width", x.bandwidth())
          .attr("height", y.bandwidth())
          .attr("rx", 2)
          .attr("fill", day.prayers.includes(prayer) ? "#4ade80" : "#2c2f3b")
          .style("transition", "fill 0.3s ease");
      });
    });

  }, [history, window.innerWidth]); // Re-render on resize

  return (
    <div className="bg-[#1e1e1e]/50 border border-gray-700/50 rounded-lg p-4">
      <h3 className="font-mono text-sm font-semibold text-blue-300 mb-2">
        <span className="text-green-400">$</span> Prayer Consistency (Last 14 Days)
      </h3>
      <div className="w-full overflow-x-auto">
        <svg ref={svgRef} className="w-full" style={{ minWidth: '300px', height: '180px' }}></svg>
      </div>
    </div>
  );
};