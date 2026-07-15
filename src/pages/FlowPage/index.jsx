import React, { useEffect } from 'react';
import { ReactFlow, Background, Controls, MiniMap, applyNodeChanges, applyEdgeChanges } from '@xyflow/react';
import TopBar from '../../components/TopBar';
import ScreenNode from '../../components/FlowControls/ScreenNode';
import TransitionEdge from '../../components/FlowControls/TransitionEdge';
import { useFlowStore } from '../../store/useFlowStore.js';
import { useProjectStore } from '../../store/useProjectStore.js';

// Styles for ReactFlow
import '@xyflow/react/dist/style.css';

// Define custom node and edge types
const nodeTypes = {
  screenNode: ScreenNode,
};

const edgeTypes = {
  transitionEdge: TransitionEdge,
};

export default function FlowPage() {
  const { nodes, edges, setNodes, setEdges } = useFlowStore();
  const { screens } = useProjectStore();

  // Sync screens from Project Store into ReactFlow nodes
  useEffect(() => {
    const updatedNodes = screens.map((screen, index) => {
      // Find if node already has coordinates positioned on viewport
      const existingNode = nodes.find((n) => n.id === screen.id);
      const x = existingNode ? existingNode.position.x : 150 + index * 260;
      const y = existingNode ? existingNode.position.y : 150;

      return {
        id: screen.id,
        type: 'screenNode',
        position: { x, y },
        data: {
          name: screen.name,
          isRoot: screen.isRoot,
          bgColor: screen.bgColor,
          pagesCount: screen.pages?.length || 1,
        },
      };
    });

    setNodes(updatedNodes);
  }, [screens, setNodes]);

  // Handle node coordinates modifications during drag
  const onNodesChange = (changes) => {
    const nextNodes = applyNodeChanges(changes, useFlowStore.getState().nodes);
    setNodes(nextNodes);
  };

  // Handle connection edge alterations
  const onEdgesChange = (changes) => {
    const nextEdges = applyEdgeChanges(changes, useFlowStore.getState().edges);
    setEdges(nextEdges);
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-slate-950 text-slate-100">
      {/* Header Bar */}
      <TopBar />

      {/* Main Flow Editor Stages */}
      <div className="flex-1 w-full h-full relative">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          fitView
          colorMode="dark"
        >
          {/* Subtle dot grid pattern */}
          <Background color="#334155" gap={16} size={1} />
          
          {/* Minimap preview in corner */}
          <MiniMap 
            nodeColor={(node) => node.data?.bgColor || '#0f172a'}
            maskColor="rgba(15, 23, 42, 0.6)"
            style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b' }}
          />

          {/* Navigation Zoom Controls */}
          <Controls 
            style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', color: '#ffffff' }}
          />
        </ReactFlow>
      </div>
    </div>
  );
}
