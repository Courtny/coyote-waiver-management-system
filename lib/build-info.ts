import packageJson from '../package.json';

/**
 * Deploy/build metadata for footer display.
 * On Vercel, system env vars are injected at build/runtime.
 */
export type BuildInfo = {
  /** Short commit SHA (7 chars) or "local" */
  shortSha: string;
  /** Full SHA when available */
  sha: string | null;
  /** production | preview | development | local */
  env: string;
  /** package.json version */
  version: string;
};

export function getBuildInfo(): BuildInfo {
  const sha =
    process.env.VERCEL_GIT_COMMIT_SHA?.trim() ||
    process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA?.trim() ||
    null;
  const shortSha = sha ? sha.slice(0, 7) : 'local';

  const vercelEnv = process.env.VERCEL_ENV?.trim();
  const env = vercelEnv || (process.env.NODE_ENV === 'production' ? 'production' : 'development');

  const version =
    process.env.NEXT_PUBLIC_APP_VERSION?.trim() || packageJson.version || '0.0.0';

  return { shortSha, sha, env, version };
}

export function formatBuildLabel(info: BuildInfo = getBuildInfo()): string {
  return `v${info.version} · ${info.shortSha} · ${info.env}`;
}
