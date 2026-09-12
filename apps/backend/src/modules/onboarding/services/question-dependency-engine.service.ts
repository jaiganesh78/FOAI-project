import { Injectable, BadRequestException } from '@nestjs/common';
import { QuestionDependencyDto } from '@gpios/shared';

@Injectable()
export class QuestionDependencyEngineService {
  evaluateDependency(dep: QuestionDependencyDto, knownFacts: Record<string, unknown>): boolean {
    const parentVal = knownFacts[dep.parentAttributeKey];
    if (parentVal === undefined || parentVal === null) return false;

    const exp = dep.expectedValue;
    switch (dep.operator) {
      case 'EQUALS':
        return String(parentVal) === String(exp);
      case 'NOT_EQUALS':
        return String(parentVal) !== String(exp);
      case 'GREATER_THAN':
        return Number(parentVal) > Number(exp);
      case 'LESS_THAN':
        return Number(parentVal) < Number(exp);
      case 'GREATER_OR_EQUAL':
        return Number(parentVal) >= Number(exp);
      case 'LESS_OR_EQUAL':
        return Number(parentVal) <= Number(exp);
      case 'IN':
        return Array.isArray(exp) ? exp.includes(parentVal) : String(exp).split(',').includes(String(parentVal));
      case 'NOT_IN':
        return Array.isArray(exp) ? !exp.includes(parentVal) : !String(exp).split(',').includes(String(parentVal));
      default:
        return String(parentVal) === String(exp);
    }
  }

  detectCycles(nodes: Array<{ id: string; dependencies: Array<{ parentQuestionId: string }> }>): void {
    const adj = new Map<string, string[]>();
    for (const node of nodes) {
      adj.set(
        node.id,
        node.dependencies.map((d) => d.parentQuestionId),
      );
    }

    const visited = new Set<string>();
    const recStack = new Set<string>();

    const dfs = (curr: string, path: string[]) => {
      visited.add(curr);
      recStack.add(curr);
      path.push(curr);

      const neighbors = adj.get(curr) || [];
      for (const n of neighbors) {
        if (!visited.has(n)) {
          dfs(n, [...path]);
        } else if (recStack.has(n)) {
          throw new BadRequestException(
            `Circular question dependency detected: ${path.join(' -> ')} -> ${n}`,
          );
        }
      }
      recStack.delete(curr);
    };

    for (const node of nodes) {
      if (!visited.has(node.id)) {
        dfs(node.id, []);
      }
    }
  }
}
