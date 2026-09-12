import { create } from 'zustand';
import { OnboardingSessionDto, QuestionDto } from '@gpios/shared';

export type AutoSaveStatus = 'IDLE' | 'SAVING' | 'SAVED' | 'ERROR';

interface OnboardingState {
  session: OnboardingSessionDto | null;
  currentStepKey: string;
  questions: QuestionDto[];
  draftAnswers: Record<string, unknown>;
  autoSaveStatus: AutoSaveStatus;

  setSession: (session: OnboardingSessionDto) => void;
  setQuestions: (questions: QuestionDto[]) => void;
  setDraftAnswer: (questionKey: string, val: unknown) => void;
  setAutoSaveStatus: (status: AutoSaveStatus) => void;
  setCurrentStepKey: (stepKey: string) => void;
}

export const useOnboardingStore = create<OnboardingState>((set) => ({
  session: null,
  currentStepKey: 'personal_info',
  questions: [],
  draftAnswers: {},
  autoSaveStatus: 'IDLE',

  setSession: (session) => set({ session, currentStepKey: session.currentStep }),
  setQuestions: (questions) => set({ questions }),
  setDraftAnswer: (questionKey, val) =>
    set((state) => ({
      draftAnswers: { ...state.draftAnswers, [questionKey]: val },
    })),
  setAutoSaveStatus: (autoSaveStatus) => set({ autoSaveStatus }),
  setCurrentStepKey: (currentStepKey) => set({ currentStepKey }),
}));
