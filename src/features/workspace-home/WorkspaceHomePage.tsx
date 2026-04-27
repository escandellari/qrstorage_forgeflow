import Link from 'next/link';

type WorkspaceHomePageProps = {
  workspaceName: string;
};

function BoxIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
      <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
      <line x1="12" y1="22.08" x2="12" y2="12" />
    </svg>
  );
}

export function WorkspaceHomePage({ workspaceName }: WorkspaceHomePageProps) {
  return (
    <div className="auth-shell">
      <div className="auth-card">
        <div className="auth-app-icon">
          <BoxIcon />
        </div>
        <h1 className="workspace-home-heading">You are inside</h1>
        <p className="workspace-home-name">{workspaceName}</p>
        <Link href="/inventory" className="ui-btn-primary" style={{ width: '100%' }}>
          Go to dashboard
        </Link>
      </div>
    </div>
  );
}
