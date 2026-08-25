import { formatBuildLabel, getBuildInfo } from '@/lib/build-info';

/** Subtle site-wide build/deploy marker for verifying which release is live. */
export function BuildMetaFooter() {
  const info = getBuildInfo();
  const label = formatBuildLabel(info);

  return (
    <footer
      className="pointer-events-none select-all px-4 py-3 text-center"
      aria-label="Build information"
    >
      <p
        className="font-mono text-[10px] leading-none tracking-wide text-muted-foreground/70"
        title={info.sha ? `Commit ${info.sha}` : 'Local or unknown commit'}
      >
        {label}
      </p>
    </footer>
  );
}
