import { Injectable, BadRequestException } from '@nestjs/common';
import { ApplicationJourneyStepDto, JourneyStepStatus } from '@gpios/shared';

@Injectable()
export class JourneyDependencyGraphService {
  topologicalSort(steps: ApplicationJourneyStepDto[]): ApplicationJourneyStepDto[] {
    const adjMap = new Map<string, string[]>();
    const inDegree = new Map<string, number>();

    steps.forEach((s) => {
      adjMap.set(s.id, []);
      inDegree.set(s.id, 0);
    });

    steps.forEach((s) => {
      s.prerequisiteStepIds.forEach((prereqId) => {
        if (adjMap.has(prereqId)) {
          adjMap.get(prereqId)!.push(s.id);
          inDegree.set(s.id, (inDegree.get(s.id) || 0) + 1);
        }
      });
    });

    const queue: string[] = [];
    inDegree.forEach((degree, id) => {
      if (degree === 0) queue.push(id);
    });

    const sortedIds: string[] = [];
    while (queue.length > 0) {
      const u = queue.shift()!;
      sortedIds.push(u);

      const neighbors = adjMap.get(u) || [];
      neighbors.forEach((v) => {
        inDegree.set(v, inDegree.get(v)! - 1);
        if (inDegree.get(v) === 0) queue.push(v);
      });
    }

    if (sortedIds.length !== steps.length) {
      throw new BadRequestException('Circular dependency detected in Journey Step Graph.');
    }

    const stepLookup = new Map<string, ApplicationJourneyStepDto>(steps.map((s) => [s.id, s]));
    return sortedIds.map((id) => stepLookup.get(id)!);
  }

  evaluateStepStatuses(steps: ApplicationJourneyStepDto[]): ApplicationJourneyStepDto[] {
    const completedSet = new Set<string>(
      steps.filter((s) => s.status === JourneyStepStatus.COMPLETED).map((s) => s.id),
    );

    return steps.map((step) => {
      if (step.status === JourneyStepStatus.COMPLETED) return step;

      const unfulfilledPrereqs = step.prerequisiteStepIds.filter((pId) => !completedSet.has(pId));
      let newStatus = step.status;

      if (unfulfilledPrereqs.length > 0) {
        newStatus = JourneyStepStatus.BLOCKED;
      } else if (step.status === JourneyStepStatus.NOT_STARTED || step.status === JourneyStepStatus.BLOCKED) {
        newStatus = JourneyStepStatus.READY;
      }

      return {
        ...step,
        status: newStatus,
        blockedByStepIds: unfulfilledPrereqs,
      };
    });
  }
}
