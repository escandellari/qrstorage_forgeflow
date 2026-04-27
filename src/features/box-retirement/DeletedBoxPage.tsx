import Link from 'next/link';

type DeletedBoxPageProps = {
  boxId: string;
};

export function DeletedBoxPage({ boxId }: DeletedBoxPageProps) {
  return (
    <div className="auth-shell">
      <div className="auth-card" style={{ alignItems: 'stretch', textAlign: 'left' }}>
        <h1 style={{ margin: '0 0 8px', fontSize: '1.4rem', fontWeight: 700 }}>
          {boxId} was deleted
        </h1>
        <p style={{ margin: '0 0 6px', fontSize: '0.95rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
          This box no longer exists. Its ID will not be reused.
        </p>
        <nav aria-label="Deleted box recovery" style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '24px' }}>
          <Link href="/inventory" className="ui-btn-primary">Back to inventory</Link>
          <Link href="/search" className="ui-btn-secondary">Search inventory</Link>
        </nav>
      </div>
    </div>
  );
}
