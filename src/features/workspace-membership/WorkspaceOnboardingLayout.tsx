import { ReactNode } from 'react';

type WorkspaceOnboardingLayoutProps = {
  children: ReactNode;
};

export function WorkspaceOnboardingLayout({ children }: WorkspaceOnboardingLayoutProps) {
  return (
    <div className="auth-shell">
      <div className="auth-card" style={{ alignItems: 'stretch', textAlign: 'left' }}>
        {children}
      </div>
    </div>
  );
}
