import Link from 'next/link';

type DeletedBoxPageProps = {
  boxId: string;
};

export function DeletedBoxPage({ boxId }: DeletedBoxPageProps) {
  return (
    <main>
      <h1>{boxId} was deleted</h1>
      <p>This box no longer exists.</p>
      <p>Its box ID will not be reused.</p>
      <nav aria-label="Deleted box recovery">
        <Link href="/inventory">Back to inventory</Link>
        <Link href="/search">Search inventory</Link>
      </nav>
    </main>
  );
}
