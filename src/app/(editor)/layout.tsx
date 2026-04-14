/**
 * Editor layout — intentionally bare so the Edit Profile workspace
 * can fill the full viewport without the regular app shell
 * (no left sidebar, no right sidebar, no bottom nav).
 */
export default function EditorLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
