import React, { useRef, useEffect } from 'react';
import * as d3 from 'd3';
import type { Node, GraphLink, Tooltip, ConnectMode } from '../types';
import { badgeColors } from '../types';
import { getLinkId } from '../utils/helpers';

interface GraphCanvasProps {
  nodes: Node[];
  links: GraphLink[];
  selectedNodeId: string | null;
  setSelectedNodeId: (id: string | null) => void;
  setTooltip: (tooltip: Tooltip) => void;
  connectMode: ConnectMode;
  setConnectMode: (mode: ConnectMode) => void;
  onNodeClickConnect: (nodeId: string) => void;
  searchTerm: string;
  onManualAdd?: (url: string, title: string, summary: string, type: any) => void;
  setNodes?: (nodes: Node[] | ((prev: Node[]) => Node[])) => void;
}

/**
 * D3 force-directed graph visualization with canvas rendering for performance
 * Features: drag nodes, zoom/pan, search highlighting, connection mode
 */
export const GraphCanvas: React.FC<GraphCanvasProps> = ({
  nodes,
  links,
  selectedNodeId,
  setSelectedNodeId,
  setTooltip,
  connectMode,
  setConnectMode,
  onNodeClickConnect,
  searchTerm,
  setNodes
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const simulationRef = useRef<d3.Simulation<Node, GraphLink>>();
  const transformRef = useRef(d3.zoomIdentity);
  const zoomBehaviorRef = useRef<d3.ZoomBehavior<HTMLCanvasElement, unknown>>();

  const centerOnNode = (nodeId: string) => {
    const node = nodes.find(n => n.id === nodeId);
    if (!node || !canvasRef.current || node.x == null || node.y == null) return;

    const canvas = canvasRef.current;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;

    // Calculate the transform to center on the node
    const scale = 1.5; // Zoom level
    const x = width / 2 - node.x * scale;
    const y = height / 2 - node.y * scale;

    if (zoomBehaviorRef.current) {
      d3.select(canvas)
        .transition()
        .duration(750)
        .call(zoomBehaviorRef.current.transform, d3.zoomIdentity.translate(x, y).scale(scale));
    }
  };

  const recenterView = () => {
    if (!canvasRef.current || nodes.length === 0) return;

    const canvas = canvasRef.current;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;

    // Calculate bounds of all nodes
    const validNodes = nodes.filter(n => n.x != null && n.y != null);
    if (validNodes.length === 0) return;

    const xs = validNodes.map(n => n.x!);
    const ys = validNodes.map(n => n.y!);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);

    const nodesWidth = maxX - minX;
    const nodesHeight = maxY - minY;
    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;

    // Calculate scale to fit all nodes with padding
    const padding = 100;
    const scaleX = (width - padding * 2) / (nodesWidth || 1);
    const scaleY = (height - padding * 2) / (nodesHeight || 1);
    const scale = Math.min(scaleX, scaleY, 1); // Don't zoom in beyond 1x

    const x = width / 2 - centerX * scale;
    const y = height / 2 - centerY * scale;

    if (zoomBehaviorRef.current) {
      d3.select(canvas)
        .transition()
        .duration(750)
        .call(zoomBehaviorRef.current.transform, d3.zoomIdentity.translate(x, y).scale(scale));
    }
  };

  useEffect(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    if (!context) return;

    let width = canvas.clientWidth;
    let height = canvas.clientHeight;

    const simulation = simulationRef.current || d3.forceSimulation<Node, GraphLink>(nodes)
      .force('link', null)  // Disable link force
      .force('charge', null)  // Disable charge force
      .force('center', null)  // Disable center force
      .alphaDecay(1);  // Stop immediately

    simulationRef.current = simulation;
    simulation.nodes(nodes);
    simulation.alpha(0).stop();  // Stop simulation completely

    // Prepare search sets
    const searchTermLower = searchTerm.trim().toLowerCase();
    const matchedNodeIds = new Set<string>();
    const neighborNodeIds = new Set<string>();
    if (searchTermLower) {
      nodes.forEach(n => {
        if (n.title.toLowerCase().includes(searchTermLower) || n.summary.toLowerCase().includes(searchTermLower)) {
          matchedNodeIds.add(n.id);
        }
      });
      links.forEach(l => {
        const sourceId = getLinkId(l.source);
        const targetId = getLinkId(l.target);
        if (matchedNodeIds.has(sourceId)) neighborNodeIds.add(targetId);
        if (matchedNodeIds.has(targetId)) neighborNodeIds.add(sourceId);
      });
    }

    let currentNode: Node | undefined;

    const ticked = () => {
      if (!context) return;
      context.save();
      context.clearRect(0, 0, canvas.width, canvas.height);
      context.translate(transformRef.current.x, transformRef.current.y);
      context.scale(transformRef.current.k, transformRef.current.k);

      // Draw Grid
      const view = {
        x: -transformRef.current.x / transformRef.current.k,
        y: -transformRef.current.y / transformRef.current.k,
        w: canvas.width / transformRef.current.k,
        h: canvas.height / transformRef.current.k
      };

      const drawGrid = (gridSize: number, strokeStyle: string) => {
        context.beginPath();
        context.strokeStyle = strokeStyle;
        context.lineWidth = 1 / transformRef.current.k;

        const xStart = Math.floor(view.x / gridSize) * gridSize;
        const xEnd = view.x + view.w;
        for (let x = xStart; x < xEnd; x += gridSize) {
          context.moveTo(x, view.y);
          context.lineTo(x, view.y + view.h);
        }

        const yStart = Math.floor(view.y / gridSize) * gridSize;
        const yEnd = view.y + view.h;
        for (let y = yStart; y < yEnd; y += gridSize) {
          context.moveTo(view.x, y);
          context.lineTo(view.x + view.w, y);
        }
        context.stroke();
      };

      drawGrid(135, 'rgba(0, 122, 255, 0.08)');
      drawGrid(35, 'rgba(0, 122, 255, 0.12)');

      // Draw links
      context.beginPath();
      links.forEach(d => {
        // Handle both Node objects and string IDs
        const sourceNode = typeof d.source === 'string' 
          ? nodes.find(n => n.id === d.source)
          : d.source as Node;
        const targetNode = typeof d.target === 'string'
          ? nodes.find(n => n.id === d.target)
          : d.target as Node;
        
        if (sourceNode && targetNode && sourceNode.x != null && sourceNode.y != null && targetNode.x != null && targetNode.y != null) {
          context.moveTo(sourceNode.x, sourceNode.y);
          context.lineTo(targetNode.x, targetNode.y);
        }
      });
      context.strokeStyle = 'rgba(0, 199, 255, 0.4)';
      context.lineWidth = 1;
      context.shadowColor = 'rgba(0, 199, 255, 1)';
      context.shadowBlur = 15;
      context.stroke();
      context.shadowBlur = 0;

      // Draw nodes
      nodes.forEach(d => {
        const isSelected = d.id === selectedNodeId;
        const isHovered = d.id === currentNode?.id;
        const isDimmed = searchTermLower && !matchedNodeIds.has(d.id) && !neighborNodeIds.has(d.id);
        const isCompleted = d.completed || false;
        context.globalAlpha = isDimmed ? 0.05 : (isCompleted ? 0.15 : 1.0);

        const baseNodeColor = d.color || badgeColors[d.type];
        const nodeColor = isCompleted ? '#808080' : baseNodeColor;
        const scale = isHovered ? 1.1 : 1.0;

        // Selection Indicator
        if (isSelected) {
          context.beginPath();
          if (d.type === 'Task') {
            // Triangle selection
            const size = 20;
            context.moveTo(d.x!, d.y! - size);
            context.lineTo(d.x! - size * 0.866, d.y! + size * 0.5);
            context.lineTo(d.x! + size * 0.866, d.y! + size * 0.5);
            context.closePath();
          } else if (d.type === 'Goal') {
            // Square selection
            const size = 20;
            context.rect(d.x! - size, d.y! - size, size * 2, size * 2);
          } else {
            // Circle selection for Skill and Link
            context.arc(d.x!, d.y!, 20, 0, 2 * Math.PI);
          }
          const selectionGradient = context.createRadialGradient(d.x!, d.y!, 16, d.x!, d.y!, 20);
          selectionGradient.addColorStop(0, 'rgba(0, 199, 255, 0)');
          selectionGradient.addColorStop(0.8, 'rgba(0, 199, 255, 0.5)');
          selectionGradient.addColorStop(1, 'rgba(0, 199, 255, 0.7)');
          context.fillStyle = selectionGradient;
          context.fill();
        }

        // Outer Corona
        context.beginPath();
        if (d.type === 'Task') {
          // Triangle corona
          const size = 16 * scale;
          context.moveTo(d.x!, d.y! - size);
          context.lineTo(d.x! - size * 0.866, d.y! + size * 0.5);
          context.lineTo(d.x! + size * 0.866, d.y! + size * 0.5);
          context.closePath();
        } else if (d.type === 'Goal') {
          // Square corona
          const size = 16 * scale;
          context.rect(d.x! - size, d.y! - size, size * 2, size * 2);
        } else if (d.type === 'Link') {
          // Chain link corona
          const size = 13 * scale;
          context.arc(d.x! - size * 0.4, d.y!, size * 0.5, 0, 2 * Math.PI);
          context.moveTo(d.x! + size * 0.9, d.y!);
          context.arc(d.x! + size * 0.4, d.y!, size * 0.5, 0, 2 * Math.PI);
        } else {
          // Circle corona for Skill
          context.arc(d.x!, d.y!, 16 * scale, 0, 2 * Math.PI);
        }
        const coronaGradient = context.createRadialGradient(d.x!, d.y!, 7 * scale, d.x!, d.y!, 16 * scale);
        const transparentNodeColor = d3.color(nodeColor)!.copy({ opacity: 0 }).toString();
        const semiTransparentNodeColor = d3.color(nodeColor)!.copy({ opacity: 0.5 }).toString();
        coronaGradient.addColorStop(0, semiTransparentNodeColor);
        coronaGradient.addColorStop(1, transparentNodeColor);
        context.fillStyle = coronaGradient;
        context.fill();

        // Main body
        context.beginPath();
        if (d.type === 'Task') {
          // Triangle main
          const size = 7 * scale;
          context.moveTo(d.x!, d.y! - size);
          context.lineTo(d.x! - size * 0.866, d.y! + size * 0.5);
          context.lineTo(d.x! + size * 0.866, d.y! + size * 0.5);
          context.closePath();
        } else if (d.type === 'Goal') {
          // Square main
          const size = 7 * scale;
          context.rect(d.x! - size, d.y! - size, size * 2, size * 2);
        } else if (d.type === 'Link') {
          // Chain link icon - two connected ovals
          const size = 6 * scale;
          
          // Left oval
          context.beginPath();
          context.ellipse(d.x! - size * 0.45, d.y!, size * 0.35, size * 0.55, -Math.PI / 4, 0, 2 * Math.PI);
          context.fill();
          
          // Right oval
          context.beginPath();
          context.ellipse(d.x! + size * 0.45, d.y!, size * 0.35, size * 0.55, Math.PI / 4, 0, 2 * Math.PI);
          context.fill();
          
          // Connection bar
          context.beginPath();
          context.moveTo(d.x! - size * 0.15, d.y! - size * 0.4);
          context.lineTo(d.x! + size * 0.15, d.y! + size * 0.4);
          context.lineWidth = size * 0.25;
          context.strokeStyle = nodeColor;
          context.stroke();
          context.lineWidth = 1;
        } else {
          // Circle main for Skill
          context.arc(d.x!, d.y!, 7 * scale, 0, 2 * Math.PI);
        }
        context.fillStyle = nodeColor;
        context.shadowColor = nodeColor;
        context.shadowBlur = 15;
        context.fill();
        context.shadowBlur = 0;

        // Bright outer ring
        context.beginPath();
        if (d.type === 'Task') {
          // Triangle ring
          const size = 8 * scale;
          context.moveTo(d.x!, d.y! - size);
          context.lineTo(d.x! - size * 0.866, d.y! + size * 0.5);
          context.lineTo(d.x! + size * 0.866, d.y! + size * 0.5);
          context.closePath();
        } else if (d.type === 'Goal') {
          // Square ring
          const size = 8 * scale;
          context.rect(d.x! - size, d.y! - size, size * 2, size * 2);
        } else if (d.type === 'Link') {
          // Chain link ring
          const size = 5 * scale;
          context.arc(d.x! - size * 0.5, d.y!, size * 0.75, 0, 2 * Math.PI);
          context.moveTo(d.x! + size * 1.25, d.y!);
          context.arc(d.x! + size * 0.5, d.y!, size * 0.75, 0, 2 * Math.PI);
        } else {
          // Circle ring for Skill
          context.arc(d.x!, d.y!, 8 * scale, 0, 2 * Math.PI);
        }
        context.strokeStyle = isHovered ? '#fff' : (d3.color(nodeColor)?.brighter(1.5).toString() || '#fff');
        context.lineWidth = isHovered ? 2.5 : 2;
        context.stroke();

        // Inner core
        context.beginPath();
        if (d.type === 'Task') {
          // Triangle core
          const size = 3 * scale;
          context.moveTo(d.x!, d.y! - size);
          context.lineTo(d.x! - size * 0.866, d.y! + size * 0.5);
          context.lineTo(d.x! + size * 0.866, d.y! + size * 0.5);
          context.closePath();
        } else if (d.type === 'Goal') {
          // Square core
          const size = 3 * scale;
          context.rect(d.x! - size, d.y! - size, size * 2, size * 2);
        } else if (d.type === 'Link') {
          // Chain link cores - small circles
          const size = 5 * scale;
          context.arc(d.x! - size * 0.5, d.y!, size * 0.3, 0, 2 * Math.PI);
          context.moveTo(d.x! + size * 0.8, d.y!);
          context.arc(d.x! + size * 0.5, d.y!, size * 0.3, 0, 2 * Math.PI);
        } else {
          // Circle core for Skill
          context.arc(d.x!, d.y!, 3 * scale, 0, 2 * Math.PI);
        }
        context.fillStyle = '#fff';
        context.fill();

        const isConnectSource = connectMode.active && d.id === connectMode.source;
        if (isConnectSource) {
          context.beginPath();
          context.arc(d.x!, d.y!, 15, 0, 2 * Math.PI);
          context.strokeStyle = 'rgba(160, 102, 255, 0.8)';
          context.lineWidth = 1.5;
          context.stroke();

          context.beginPath();
          context.arc(d.x!, d.y!, 19, 0, 2 * Math.PI);
          context.strokeStyle = 'rgba(160, 102, 255, 0.4)';
          context.lineWidth = 3;
          context.stroke();
        }
      });
      context.globalAlpha = 1.0;

      // Draw labels below nodes
      const drawLabel = (d: Node, isSelected: boolean) => {
        const isDimmed = searchTermLower && !matchedNodeIds.has(d.id) && !neighborNodeIds.has(d.id);
        if (!isDimmed) {
          const label = d.title.length > 25 ? d.title.substring(0, 22) + '...' : d.title;
          context.font = isSelected ? '700 10px var(--font-family)' : '500 10px var(--font-family)';
          context.fillStyle = isSelected ? 'var(--primary-color)' : 'var(--text-primary)';
          context.textAlign = 'center';
          context.textBaseline = 'top';
          context.fillText(label, d.x!, d.y! + 17);
        }
      };

      // Draw all labels
      nodes.forEach(d => {
        drawLabel(d, d.id === selectedNodeId);
      });

      context.restore();
    };

    simulation.on('tick', ticked);

    // Interactivity
    const findNode = (x: number, y: number) => {
      const transformed = transformRef.current.invert([x, y]);
      return simulation.find(transformed[0], transformed[1], 30);
    };

    const d3canvas = d3.select(canvas);

    const handleClick = (event: MouseEvent) => {
      const node = findNode(event.offsetX, event.offsetY);
      console.log('Node clicked:', node?.id, 'Connect mode:', connectMode.active, 'Source:', connectMode.source);
      if (connectMode.active) {
        onNodeClickConnect(node ? node.id : '');
        setConnectMode({ active: false, source: null });
      } else if (node) {
        setSelectedNodeId(node.id);
      } else {
        setSelectedNodeId(null);
      }
    };
    canvas.addEventListener('click', handleClick);

    const handleMouseMove = (event: MouseEvent) => {
      const node = findNode(event.offsetX, event.offsetY);
      if (node) {
        canvas.style.cursor = 'pointer';
      } else {
        canvas.style.cursor = connectMode.active ? 'crosshair' : 'grab';
      }
    };
    canvas.addEventListener('mousemove', handleMouseMove);

    const drag = d3.drag<HTMLCanvasElement, Node | undefined>()
      .subject((event) => findNode(event.x, event.y))
      .filter((event) => {
        // Disable drag when in connection mode
        return !connectMode.active;
      })
      .on('start', (event) => {
        if (!event.subject) return;
        canvas.style.cursor = 'grabbing';
        event.subject.fx = event.subject.x;
        event.subject.fy = event.subject.y;
      })
      .on('drag', (event) => {
        if (!event.subject) return;
        // Transform screen coordinates to canvas coordinates
        const transform = transformRef.current;
        event.subject.fx = (event.x - transform.x) / transform.k;
        event.subject.fy = (event.y - transform.y) / transform.k;
        event.subject.x = event.subject.fx;
        event.subject.y = event.subject.fy;
        ticked(); // Redraw immediately
      })
      .on('end', (event) => {
        if (!event.subject) return;
        canvas.style.cursor = 'grab';
        // Keep node fixed at dragged position
        event.subject.fx = event.subject.x;
        event.subject.fy = event.subject.y;
        
        // Update node in database with new position
        if (setNodes) {
          setNodes(prev => prev.map(n => 
            n.id === event.subject.id 
              ? { ...n, x: event.subject.x, y: event.subject.y } 
              : n
          ));
        }
      });
    d3canvas.call(drag as any);

    const zoom = d3.zoom<HTMLCanvasElement, unknown>().on('zoom', (event) => {
      transformRef.current = event.transform;
      ticked();
    });
    zoomBehaviorRef.current = zoom;
    d3canvas.call(zoom as any);

    const observer = new ResizeObserver(entries => {
      for (const entry of entries) {
        width = entry.contentRect.width;
        height = entry.contentRect.height;
        canvas.width = width;
        canvas.height = height;
        const centerForce = simulation.force('center') as d3.ForceCenter<Node>;
        if (centerForce) {
          centerForce.x(width / 2).y(height / 2);
        }
        simulation.alpha(0.3).restart();
      }
    });
    observer.observe(canvas);

    return () => {
      simulation.stop();
      observer.disconnect();
      canvas.removeEventListener('click', handleClick);
      canvas.removeEventListener('mousemove', handleMouseMove);
      d3canvas.on('.drag', null);
      d3canvas.on('.zoom', null);
    };
  }, [nodes, links, connectMode, onNodeClickConnect, setSelectedNodeId, setTooltip, searchTerm, selectedNodeId]);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <canvas
        ref={canvasRef}
        style={{
          width: '100%',
          height: '100%',
          cursor: connectMode.active ? 'crosshair' : 'grab'
        }}
      />
      
      {/* Legend */}
      <div style={{
        position: 'absolute',
        bottom: '1.35rem',
        left: '1.35rem',
        backgroundColor: 'rgba(30, 30, 35, 0.95)',
        backdropFilter: 'blur(10px)',
        border: '1px solid var(--border-color)',
        borderRadius: '8px',
        padding: '0.85rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
      }}>
        <div style={{
          fontSize: '0.65rem',
          fontWeight: 600,
          color: 'var(--text-secondary)',
          marginBottom: '0.15rem',
          letterSpacing: '0.5px',
        }}>
          LEGEND
        </div>
        
        {[
          { type: 'Task', shape: '▲', color: badgeColors.Task },
          { type: 'Skill', shape: '●', color: badgeColors.Skill },
          { type: 'Goal', shape: '■', color: badgeColors.Goal },
          { type: 'Link', shape: '🔗', color: badgeColors.Link },
        ].map(({ type, shape, color }) => (
          <div key={type} style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}>
            <span style={{
              fontSize: '0.85rem',
              color: color,
              width: '14px',
              textAlign: 'center',
              filter: 'drop-shadow(0 0 4px currentColor)',
            }}>
              {shape}
            </span>
            <span style={{
              fontSize: '0.7rem',
              color: 'var(--text-primary)',
              fontWeight: 500,
            }}>
              {type}
            </span>
          </div>
        ))}
      </div>

      {/* Recenter View Button */}
      <button
        onClick={recenterView}
        style={{
          position: 'absolute',
          top: '1.35rem',
          right: '1.35rem',
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          borderRadius: '8px',
          padding: '0.5rem',
          color: '#ffffff',
          fontSize: '0.7rem',
          fontWeight: 600,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '0.35rem',
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2)',
          transition: 'all 0.2s ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.15)';
          e.currentTarget.style.transform = 'translateY(-2px)';
          e.currentTarget.style.boxShadow = '0 6px 20px rgba(0, 0, 0, 0.3)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = '0 4px 16px rgba(0, 0, 0, 0.2)';
        }}
        title="Recenter view to fit all nodes"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"></path>
          <path d="M21 3v5h-5"></path>
          <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"></path>
          <path d="M3 21v-5h5"></path>
        </svg>
      </button>

      {/* Center on Node Button */}
      {selectedNodeId && (
        <button
          onClick={() => centerOnNode(selectedNodeId)}
          style={{
            position: 'absolute',
            bottom: '1.35rem',
            right: '1.35rem',
            backgroundColor: 'rgba(99, 102, 241, 0.9)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(99, 102, 241, 0.4)',
            borderRadius: '8px',
            padding: '0.6rem 1rem',
            color: '#ffffff',
            fontSize: '0.7rem',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.35rem',
            boxShadow: '0 8px 32px rgba(99, 102, 241, 0.3)',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(99, 102, 241, 1)';
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 12px 40px rgba(99, 102, 241, 0.4)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(99, 102, 241, 0.9)';
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 8px 32px rgba(99, 102, 241, 0.3)';
          }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <circle cx="12" cy="12" r="3"></circle>
          </svg>
          Center on Node
        </button>
      )}
    </div>
  );
};
