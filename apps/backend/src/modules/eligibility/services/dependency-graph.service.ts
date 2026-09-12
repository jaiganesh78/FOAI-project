import { Injectable } from '@nestjs/common';
import { CompiledRuleTree } from './compiled-rule-cache.service';

@Injectable()
export class DependencyGraphService {
  buildDependencyGraph(rules: CompiledRuleTree[]): { nodes: string[]; edges: { from: string; to: string }[] } {
    const nodes = rules.map((r) => r.ruleCode);
    const edges: { from: string; to: string }[] = [];

    // Construct graph nodes and edges
    return { nodes, edges };
  }
}
