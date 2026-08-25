import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { formatBuildLabel, getBuildInfo, type BuildInfo } from '../build-info';

describe('formatBuildLabel', () => {
  it('formats version, short sha, and env', () => {
    const info: BuildInfo = {
      shortSha: '3e94aba',
      sha: '3e94aba0123456789',
      env: 'production',
      version: '1.0.0',
    };
    assert.equal(formatBuildLabel(info), 'v1.0.0 · 3e94aba · production');
  });
});

describe('getBuildInfo', () => {
  it('falls back to local when no commit sha is set', () => {
    const prevSha = process.env.VERCEL_GIT_COMMIT_SHA;
    const prevPublic = process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA;
    const prevEnv = process.env.VERCEL_ENV;
    delete process.env.VERCEL_GIT_COMMIT_SHA;
    delete process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA;
    delete process.env.VERCEL_ENV;

    try {
      const info = getBuildInfo();
      assert.equal(info.shortSha, 'local');
      assert.equal(info.sha, null);
    } finally {
      if (prevSha !== undefined) process.env.VERCEL_GIT_COMMIT_SHA = prevSha;
      if (prevPublic !== undefined) process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA = prevPublic;
      if (prevEnv !== undefined) process.env.VERCEL_ENV = prevEnv;
    }
  });

  it('shortens VERCEL_GIT_COMMIT_SHA', () => {
    const prevSha = process.env.VERCEL_GIT_COMMIT_SHA;
    const prevEnv = process.env.VERCEL_ENV;
    process.env.VERCEL_GIT_COMMIT_SHA = 'abcdef0123456789abcdef';
    process.env.VERCEL_ENV = 'preview';

    try {
      const info = getBuildInfo();
      assert.equal(info.shortSha, 'abcdef0');
      assert.equal(info.env, 'preview');
    } finally {
      if (prevSha !== undefined) process.env.VERCEL_GIT_COMMIT_SHA = prevSha;
      else delete process.env.VERCEL_GIT_COMMIT_SHA;
      if (prevEnv !== undefined) process.env.VERCEL_ENV = prevEnv;
      else delete process.env.VERCEL_ENV;
    }
  });
});
