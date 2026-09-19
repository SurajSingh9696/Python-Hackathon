'use client';

import React, { useState, useMemo } from 'react';

interface TraceNode {
  id: string;
  label: string;
  type: string;
  retrieved: boolean;
}

interface TraceEdge {
  from: string;
  to: string;
}

interface KnowledgeTraceGraphProps {
  nodes: TraceNode[];
  edges: TraceEdge[];
  adapterMode: string;
  retrievalMs: number;
}

interface PositionedNode extends TraceNode {
  x: number;
  y: number;
  color: string;
}

export function KnowledgeTraceGraph({
  nodes,
  edges,
  adapterMode,
  retrievalMs,
}: KnowledgeTraceGraphProps) {
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  const activeNodes = useMemo(() => {
    if (nodes && nodes.length > 0) return nodes;
    return [
      { id: 'query', label: 'User Intent & Goal', type: 'query', retrieved: true },
      { id: 'sbi-scholar', label: 'SBI Scholar Scheme', type: 'source', retrieved: true },
      { id: 'moratorium-policy', label: 'RBI Moratorium FAQ', type: 'source', retrieved: true },
      { id: 'csis-subsidy', label: 'CSIS Interest Subsidy', type: 'source', retrieved: true },
      { id: 'claim-emi', label: 'Reducing-Balance EMI', type: 'claim', retrieved: true },
      { id: 'claim-foir', label: 'Repayment FOIR < 50%', type: 'claim', retrieved: true },
    ];
  }, [nodes]);

  const activeEdges = useMemo(() => {
    if (edges && edges.length > 0) return edges;
    return [
      { from: 'query', to: 'sbi-scholar' },
      { from: 'query', to: 'moratorium-policy' },
      { from: 'query', to: 'csis-subsidy' },
      { from: 'sbi-scholar', to: 'claim-emi' },
      { from: 'moratorium-policy', to: 'claim-foir' },
    ];
  }, [edges]);

  const positionedNodes = useMemo(() => {
    const width = 420;
    const height = 220;

    const columnMap: Record<string, PositionedNode[]> = {
      query: [],
      source: [],
      claim: [],
    };

    activeNodes.forEach((node) => {
      const type = node.type.toLowerCase();
      if (type.includes('query') || type === 'root') {
        columnMap.query!.push({ ...node, x: 0, y: 0, color: 'var(--ink-navy)' });
      } else if (type.includes('claim') || type.includes('output') || type.includes('metric')) {
        columnMap.claim!.push({ ...node, x: 0, y: 0, color: 'var(--present-green)' });
      } else {
        columnMap.source!.push({ ...node, x: 0, y: 0, color: 'var(--roll-brass)' });
      }
    });

    if (columnMap.query!.length === 0) {
      columnMap.query!.push({
        id: 'query-root',
        label: 'Financial Goal',
        type: 'query',
        retrieved: true,
        x: 0,
        y: 0,
        color: 'var(--ink-navy)',
      });
    }

    const posMap = new Map<string, PositionedNode>();

    columnMap.query!.forEach((n, idx) => {
      const spacing = height / (columnMap.query!.length + 1);
      const y = spacing * (idx + 1);
      posMap.set(n.id, { ...n, x: 50, y });
    });

    columnMap.source!.forEach((n, idx) => {
      const spacing = height / (columnMap.source!.length + 1);
      const y = spacing * (idx + 1);
      posMap.set(n.id, { ...n, x: 210, y });
    });

    columnMap.claim!.forEach((n, idx) => {
      const spacing = height / (columnMap.claim!.length + 1);
      const y = spacing * (idx + 1);
      posMap.set(n.id, { ...n, x: 370, y });
    });

    return posMap;
  }, [activeNodes]);

  const selectedNode = selectedNodeId ? positionedNodes.get(selectedNodeId) : null;

  return (
    <div className="flex flex-col gap-2.5 p-3 rounded-[6px] bg-[var(--card)] border border-[var(--rule-line)] font-mono">
      <div className="flex items-center justify-between border-b border-[var(--rule-line)] pb-1.5">
        <span className="text-label">
          Knowledge Graph Registry
        </span>
        <div className="flex items-center gap-2 text-[10px]">
          <span className="px-1.5 py-0.5 rounded-[4px] border border-[var(--rule-line)] bg-[var(--ledger-paper)] text-[var(--ink-navy)]">
            {adapterMode}
          </span>
          <span className="tabular-nums text-[var(--present-green)] font-bold">{retrievalMs}ms</span>
        </div>
      </div>

      {/* SVG Canvas */}
      <div className="relative w-full overflow-hidden rounded-[4px] bg-[var(--ledger-paper)] border border-[var(--rule-line)]">
        <svg
          viewBox="0 0 420 220"
          className="w-full h-auto select-none"
          style={{ minHeight: '180px' }}
        >
          {/* Render directed bezier edges */}
          {activeEdges.map((edge, idx) => {
            const start = positionedNodes.get(edge.from);
            const end = positionedNodes.get(edge.to);
            if (!start || !end) return null;

            const dx = end.x - start.x;
            const pathData = `M ${start.x} ${start.y} C ${start.x + dx * 0.5} ${start.y}, ${end.x - dx * 0.5} ${end.y}, ${end.x} ${end.y}`;

            return (
              <g key={`edge-${idx}`}>
                <path
                  d={pathData}
                  fill="none"
                  stroke="var(--rule-line)"
                  strokeWidth="1.5"
                />
                <path
                  d={pathData}
                  fill="none"
                  stroke="var(--roll-brass)"
                  strokeWidth="1.5"
                  strokeDasharray="3 3"
                  className="animate-pulse"
                />
              </g>
            );
          })}

          {/* Render Nodes */}
          {Array.from(positionedNodes.values()).map((node) => {
            const isSelected = selectedNodeId === node.id;
            return (
              <g
                key={node.id}
                onClick={() => setSelectedNodeId(isSelected ? null : node.id)}
                className="cursor-pointer"
              >
                <circle
                  cx={node.x}
                  cy={node.y}
                  r={isSelected ? 14 : 11}
                  fill="var(--card)"
                  stroke={isSelected ? 'var(--roll-brass)' : node.color}
                  strokeWidth={isSelected ? 2 : 1.5}
                />
                <circle
                  cx={node.x}
                  cy={node.y}
                  r={isSelected ? 6 : 4}
                  fill={node.color}
                />
                <text
                  x={node.x}
                  y={node.y + 18}
                  textAnchor="middle"
                  className="text-[9px] fill-[var(--ink-navy)] font-mono pointer-events-none"
                >
                  {node.label.length > 15 ? `${node.label.slice(0, 13)}…` : node.label}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Selected Node Details or Legend */}
      {selectedNode ? (
        <div className="p-2 rounded-[4px] bg-[var(--ledger-paper)] border border-[var(--rule-line)] text-xs flex flex-col gap-0.5">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-[var(--ink-navy)]">{selectedNode.label}</span>
            <span className="text-[9px] px-1.5 py-0.2 rounded uppercase border border-[var(--rule-line)] text-[var(--muted-foreground)]">
              {selectedNode.type}
            </span>
          </div>
          <div className="text-[10px] text-[var(--muted-foreground)]">
            Status: <span className="text-[var(--present-green)]">Verified</span> · ID: <code>{selectedNode.id}</code>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between text-[10px] text-[var(--muted-foreground)] px-1">
          <div className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--ink-navy)]" /> Query
          </div>
          <div className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--roll-brass)]" /> Source
          </div>
          <div className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--present-green)]" /> Verified Claim
          </div>
        </div>
      )}
    </div>
  );
}
