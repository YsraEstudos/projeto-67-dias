
import { SkillRoadmapItem, VisualRoadmap, VisualRoadmapNode, VisualRoadmapConnection } from '../../types';

/**
 * Synchronizes the tasks (list) and visual roadmap (nodes).
 * 
 * Rules:
 * 1. IDs are the source of truth.
 * 2. If 'tasks' is the source:
 *    - New tasks -> New nodes (auto-positioned)
 *    - Deleted tasks -> Deleted nodes
 *    - Updated task (title, completion) -> Update node
 * 3. If 'visual' is the source:
 *    - New nodes -> New tasks (appended to end if no section, or maintain order if possible)
 *    - Deleted nodes -> Deleted tasks
 *    - Updated node (title, completion) -> Update task
 * 4. Sections in tasks <-> 'section' nodes in visual
 */
export const syncRoadmapState = (
    currentRoadmap: SkillRoadmapItem[],
    currentVisualRoadmap: VisualRoadmap | undefined,
    source: 'tasks' | 'visual'
): { roadmap: SkillRoadmapItem[]; visualRoadmap: VisualRoadmap } => {

    // Ensure visual roadmap exists
    const visual = currentVisualRoadmap || { nodes: [], connections: [] };
    const visualNodesMap = new Map(visual.nodes.map(n => [n.id, n]));
    const roadmapItemsMap = new Map();

    // Flatten roadmap items for easier lookup (handling subtasks if we were doing deep sync, 
    // but for now we'll stick to top-level or rudimentary subtask support if needed. 
    // The current RoadmapSection mainly deals with top level items or shallow subtasks.
    // Let's flatten to map IDs.)
    const flattenedRoadmapItems: SkillRoadmapItem[] = [];
    const traverse = (items: SkillRoadmapItem[]) => {
        items.forEach(item => {
            flattenedRoadmapItems.push(item);
            roadmapItemsMap.set(item.id, item);
            if (item.subTasks) traverse(item.subTasks);
        });
    };
    traverse(currentRoadmap);

    let newRoadmap = [...currentRoadmap];
    let newVisualNodes = [...visual.nodes];
    let newVisualConnections = [...visual.connections];

    if (source === 'tasks') {
        // Source is Tasks (RoadmapSection)
        // 1. Update or Add Nodes based on Tasks
        flattenedRoadmapItems.forEach(task => {
            const existingNode = visualNodesMap.get(task.id);
            if (existingNode) {
                // Update existing node
                if (existingNode.title !== task.title || existingNode.isCompleted !== task.isCompleted) {
                    const nodeIndex = newVisualNodes.findIndex(n => n.id === task.id);
                    if (nodeIndex !== -1) {
                        newVisualNodes[nodeIndex] = {
                            ...newVisualNodes[nodeIndex],
                            title: task.title,
                            isCompleted: task.isCompleted,
                            type: task.type === 'SECTION' ? 'section' : newVisualNodes[nodeIndex].type
                        };
                    }
                }
            } else {
                // Create new node
                // Simple auto-layout: find last node position or start at center
                const lastNode = newVisualNodes[newVisualNodes.length - 1];
                const startX = lastNode ? lastNode.x + 200 : 100;
                const startY = lastNode ? lastNode.y : 300; // maintain row-ish

                // If it's a section, maybe break to new line? 
                // For now simple horizontal growth

                const newNode: VisualRoadmapNode = {
                    id: task.id,
                    title: task.title,
                    type: task.type === 'SECTION' ? 'section' : 'main',
                    x: startX,
                    y: startY,
                    isCompleted: task.isCompleted
                };
                newVisualNodes.push(newNode);

                // Auto-connect to previous node if it's not a section (optional but nice)
                if (lastNode && task.type !== 'SECTION' && lastNode.type !== 'section') {
                    newVisualConnections.push({
                        id: `conn-${lastNode.id}-${task.id}`,
                        sourceId: lastNode.id,
                        targetId: task.id,
                        style: 'solid'
                    });
                }
            }
        });

        // 2. Remove Nodes that are no longer in Tasks
        newVisualNodes = newVisualNodes.filter(node => roadmapItemsMap.has(node.id));
        // Cleanup connections
        const nodeIds = new Set(newVisualNodes.map(n => n.id));
        newVisualConnections = newVisualConnections.filter(c => nodeIds.has(c.sourceId) && nodeIds.has(c.targetId));

    } else {
        // Source is Visual Editor
        // 1. Update or Add Tasks based on Nodes
        const roadmapIds = new Set(flattenedRoadmapItems.map(i => i.id));

        visual.nodes.forEach(node => {
            if (roadmapIds.has(node.id)) {
                // Update existing task
                // We need to map over the structure. 
                // Since structure is recursive, it's safer to map the root array and subtasks.
                const updateInList = (list: SkillRoadmapItem[]): SkillRoadmapItem[] => {
                    return list.map(item => {
                        if (item.id === node.id) {
                            return {
                                ...item,
                                title: node.title,
                                isCompleted: node.isCompleted,
                                // We don't change type easily back from visual to task type structure yet
                            };
                        }
                        if (item.subTasks) {
                            return { ...item, subTasks: updateInList(item.subTasks) };
                        }
                        return item;
                    });
                };
                newRoadmap = updateInList(newRoadmap);
            } else {
                // Add new task
                // We append to the end of the roadmap for now. 
                // Smart placement would require analyzing coordinates or connections, which is complex.
                const newTask: SkillRoadmapItem = {
                    id: node.id,
                    title: node.title,
                    isCompleted: node.isCompleted,
                    type: node.type === 'section' ? 'SECTION' : 'TASK'
                };
                newRoadmap.push(newTask);
            }
        });

        // 2. Remove Tasks that are no longer in Nodes
        // Recursive filter
        const filterList = (list: SkillRoadmapItem[]): SkillRoadmapItem[] => {
            return list.filter(item => {
                const exists = visualNodesMap.has(item.id);
                if (item.subTasks) {
                    item.subTasks = filterList(item.subTasks);
                }
                // If it has subtasks that still exist, maybe keep it? 
                // Strict sync says: if node is gone, task is gone.
                return exists;
            });
        };
        newRoadmap = filterList(newRoadmap);
    }

    return {
        roadmap: newRoadmap,
        visualRoadmap: {
            nodes: newVisualNodes,
            connections: newVisualConnections,
            rootId: visual.rootId
        }
    };
};
