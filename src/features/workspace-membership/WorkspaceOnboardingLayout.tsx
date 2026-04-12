import { ReactNode } from 'react';

type WorkspaceOnboardingLayoutProps = {
  children: ReactNode;
};

export function WorkspaceOnboardingLayout({ children }: WorkspaceOnboardingLayoutProps) {
  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
      }}
    >
      <section
        style={{
          width: '100%',
          maxWidth: '640px',
          backgroundColor: '#ffffff',
          border: '1px solid #e9e2ff',
          borderRadius: '24px',
          padding: '32px 24px',
          boxShadow: '0 20px 45px rgba(108, 74, 182, 0.12)',
        }}
      >
        {children}
      </section>
    </main>
  );
}
