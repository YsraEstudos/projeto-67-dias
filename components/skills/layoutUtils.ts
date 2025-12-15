import { VisualRoadmapNode, VisualRoadmapConnection } from '../../types';

/**
 * Lazy loads dagre and computes auto-layout for nodes.
 * Dagre (~20KB gzipped) is only loaded when this function is called.
 */
export const getLayoutedElements = async (
    nodes: VisualRoadmapNode[],
    connections: VisualRoadmapConnection[],
    direction: 'TB' | 'LR' = 'LR'
): Promise<{ nodes: VisualRoadmapNode[]; connections: VisualRoadmapConnection[] }> => {
    // Lazy load dagre only when needed
    const dagre = await import('dagre');

    const dagreGraph = new dagre.default.graphlib.Graph();
    dagreGraph.setDefaultEdgeLabel(() => ({}));

    const isHorizontal = direction === 'LR';
    dagreGraph.setGraph({
        rankdir: direction,
        nodesep: isHorizontal ? 60 : 100,
        ranksep: isHorizontal ? 150 : 80,
        marginx: 20,
        marginy: 20
    });

    nodes.forEach((node) => {
        const baseWidth = node.type === 'section' ? 300 : 220;
        const textLength = node.title.length;
        const estimatedWidth = Math.max(baseWidth, Math.min(400, baseWidth + (textLength * 5)));
        const height = node.type === 'section' ? 80 : 100;

        dagreGraph.setNode(node.id, { width: estimatedWidth, height });
    });

    connections.forEach((conn) => {
        dagreGraph.setEdge(conn.sourceId, conn.targetId);
    });

    dagre.default.layout(dagreGraph);

    const newNodes = nodes.map((node) => {
        const nodeWithPosition = dagreGraph.node(node.id);
        return {
            ...node,
            x: nodeWithPosition.x - nodeWithPosition.width / 2,
            y: nodeWithPosition.y - nodeWithPosition.height / 2,
        };
    });

    return { nodes: newNodes, connections };
};
