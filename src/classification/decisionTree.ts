/**
 * Decision Tree Engine - Pure tree evaluation
 * 
 * Evaluates JSON-configured decision trees without side effects.
 * Produces audit trails for explainability.
 */

import { z } from 'zod';

// --- Types ---
export const ConditionSchema = z.object({
    type: z.enum(['url_matches', 'text_contains', 'compare', 'flag', 'and', 'or']),
    pattern: z.string().optional(),
    field: z.string().optional(),
    operator: z.enum(['>', '<', '>=', '<=', '==', '!=']).optional(),
    value: z.any().optional(),
    conditions: z.array(z.lazy(() => ConditionSchema)).optional()
});

export type Condition = z.infer<typeof ConditionSchema>;

export const DecisionNodeSchema: z.ZodType<any> = z.object({
    id: z.string(),
    condition: ConditionSchema.optional(),
    yes: z.lazy(() => DecisionNodeSchema).optional(),
    no: z.lazy(() => DecisionNodeSchema).optional(),
    result: z.boolean().optional(),
    confidence: z.number().optional()
});

export type DecisionNode = z.infer<typeof DecisionNodeSchema>;

export interface EvaluationContext {
    url?: string;
    title?: string;
    content?: string;
    wordCount?: number;
    flags?: Record<string, boolean>;
    [key: string]: any;
}

export interface PathStep {
    nodeId: string;
    condition: string;
    result: boolean;
    branch: 'yes' | 'no';
}

export interface EvaluationResult {
    match: boolean;
    confidence: number;
    path: PathStep[];
    reason: string;
}

/**
 * Evaluate a condition against context
 */
function evaluateCondition(condition: Condition, context: EvaluationContext): boolean {
    switch (condition.type) {
        case 'url_matches':
            if (!context.url || !condition.pattern) return false;
            try {
                const regex = new RegExp(condition.pattern, 'i');
                return regex.test(context.url);
            } catch {
                return context.url.includes(condition.pattern);
            }

        case 'text_contains':
            const text = (context.title || '') + ' ' + (context.content || '');
            if (!condition.pattern) return false;
            return text.toLowerCase().includes(condition.pattern.toLowerCase());

        case 'compare':
            if (!condition.field || condition.operator === undefined) return false;
            const fieldValue = context[condition.field];
            const target = condition.value;
            switch (condition.operator) {
                case '>': return fieldValue > target;
                case '<': return fieldValue < target;
                case '>=': return fieldValue >= target;
                case '<=': return fieldValue <= target;
                case '==': return fieldValue == target;
                case '!=': return fieldValue != target;
            }
            return false;

        case 'flag':
            if (!condition.field) return false;
            return context.flags?.[condition.field] === true;

        case 'and':
            return (condition.conditions || []).every(c => evaluateCondition(c, context));

        case 'or':
            return (condition.conditions || []).some(c => evaluateCondition(c, context));

        default:
            return false;
    }
}

/**
 * Describe a condition for audit trail
 */
function describeCondition(condition: Condition): string {
    switch (condition.type) {
        case 'url_matches':
            return `URL matches "${condition.pattern}"`;
        case 'text_contains':
            return `Text contains "${condition.pattern}"`;
        case 'compare':
            return `${condition.field} ${condition.operator} ${condition.value}`;
        case 'flag':
            return `Flag "${condition.field}" is set`;
        case 'and':
            return `All of: ${(condition.conditions || []).map(describeCondition).join(', ')}`;
        case 'or':
            return `Any of: ${(condition.conditions || []).map(describeCondition).join(', ')}`;
        default:
            return 'Unknown condition';
    }
}

/**
 * Evaluate a decision tree node recursively
 */
function evaluateNode(
    node: DecisionNode,
    context: EvaluationContext,
    path: PathStep[]
): { match: boolean; confidence: number } {
    // Leaf node with result
    if (node.result !== undefined) {
        return {
            match: node.result,
            confidence: node.confidence ?? (node.result ? 0.8 : 0.2)
        };
    }

    // Decision node
    if (!node.condition) {
        return { match: false, confidence: 0 };
    }

    const result = evaluateCondition(node.condition, context);
    const branch = result ? 'yes' : 'no';
    const nextNode = result ? node.yes : node.no;

    path.push({
        nodeId: node.id,
        condition: describeCondition(node.condition),
        result,
        branch
    });

    if (!nextNode) {
        return { match: result, confidence: 0.5 };
    }

    return evaluateNode(nextNode, context, path);
}

/**
 * Evaluate a decision tree against context
 * @param tree - Root decision node
 * @param context - Evaluation context
 * @returns Evaluation result with audit trail
 */
export function evaluateTree(tree: DecisionNode, context: EvaluationContext): EvaluationResult {
    const path: PathStep[] = [];
    const { match, confidence } = evaluateNode(tree, context, path);

    const reason = path.length > 0
        ? path.map(p => `${p.nodeId}:${p.branch}`).join(',')
        : 'empty-tree';

    return { match, confidence, path, reason };
}

/**
 * Evaluate multiple trees (categories) against context
 */
export function evaluateAllTrees(
    trees: { id: string; tree: DecisionNode }[],
    context: EvaluationContext
): { id: string; result: EvaluationResult }[] {
    return trees.map(({ id, tree }) => ({
        id,
        result: evaluateTree(tree, context)
    }));
}

/**
 * Get matching categories only
 */
export function getMatches(
    trees: { id: string; tree: DecisionNode }[],
    context: EvaluationContext
): { id: string; result: EvaluationResult }[] {
    return evaluateAllTrees(trees, context).filter(r => r.result.match);
}
