import dagre from 'dagre';
import { VisualRoadmapNode, VisualRoadmapConnection } from '../../types';

export const getLayoutedElements = (
    nodes: VisualRoadmapNode[],
    connections: VisualRoadmapConnection[],
    direction: 'TB' | 'LR' = 'LR'
) => {
    const dagreGraph = new dagre.graphlib.Graph();
    dagreGraph.setDefaultEdgeLabel(() => ({}));

    const isHorizontal = direction === 'LR';
    dagreGraph.setGraph({
        rankdir: direction,
        nodesep: isHorizontal ? 60 : 100, // Gap between nodes in valid rank
        ranksep: isHorizontal ? 150 : 80, // Gap between ranks
        marginx: 20,
        marginy: 20
    });

    nodes.forEach((node) => {
        // Width and height depend on the node type content. 
        // We approximate standard task dimensions more accurately based on text length.
        // Base width for tasks is ~200px. Sections ~300px.
        // We add some buffer for longer titles.
        const baseWidth = node.type === 'section' ? 300 : 220;
        const textLength = node.title.length;
        const estimatedWidth = Math.max(baseWidth, Math.min(400, baseWidth + (textLength * 5))); // Cap at 400px

        const height = node.type === 'section' ? 80 : 100; // Taller for better vertical rhythm

        dagreGraph.setNode(node.id, { width: estimatedWidth, height });
    });

    connections.forEach((conn) => {
        dagreGraph.setEdge(conn.sourceId, conn.targetId);
    });

    dagre.layout(dagreGraph);

    const newNodes = nodes.map((node) => {
        const nodeWithPosition = dagreGraph.node(node.id);

        // We are shifting the dagre node position (anchor=center center) to the top left
        // so it matches the React Flow / absolute positioning standard usually expects, 
        // BUT our current custom implementation uses center or top-left? 
        // Looking at VisualRoadmapEditor, it uses `left: node.x, top: node.y`. 
        // And generally `x, y` represents the top-left corner in HTML absolute positioning.
        // Dagre gives center point.

        return {
            ...node,
            x: nodeWithPosition.x - nodeWithPosition.width / 2,
            y: nodeWithPosition.y - nodeWithPosition.height / 2,
        };
    });

    return { nodes: newNodes, connections };
};
