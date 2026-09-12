'use client';

import React from 'react';
import { AutoSaveStatus } from '../../store/onboarding.store';

interface Props {
  status: AutoSaveStatus;
}

export const AutoSaveIndicator: React.FC<Props> = ({ status }) => {
  if (status === 'IDLE') return null;

  return (
    <div className="flex items-center space-x-2 text-xs">
      {status === 'SAVING' && (
        <span className="flex items-center space-x-1.5 text-amber-400">
          <span className="h-2 w-2 animate-ping rounded-full bg-amber-400" />
          <span>Saving draft...</span>
        </span>
      )}
      {status === 'SAVED' && (
        <span className="flex items-center space-x-1.5 text-emerald-400">
          <span className="h-2 w-2 rounded-full bg-emerald-400" />
          <span>Saved to profile</span>
        </span>
      )}
      {status === 'ERROR' && (
        <span className="flex items-center space-x-1.5 text-rose-400">
          <span className="h-2 w-2 rounded-full bg-rose-400" />
          <span>Save failed</span>
        </span>
      )}
    </div>
  );
};
