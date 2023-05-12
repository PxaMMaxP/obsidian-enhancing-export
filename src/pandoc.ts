import { exec } from './utils';
import semver from 'semver/preload';
import type { SemVer } from 'semver';

export class Pandoc {
  public readonly path: string;
  public readonly version: SemVer;

  private constructor(path: string, version: SemVer) {
    this.path = path;
    this.version = version;
  }

  static async new(path?: string): Promise<Pandoc> {
    path = path ?? 'pandoc';
    return new Pandoc(path, await getPandocVersion(path));
  }
}

export async function getPandocVersion(path?: string): Promise<SemVer> {
  path = path ?? 'pandoc';
  let version = await exec(`${path} --version`);
  version = version.substring(0, version.indexOf('\n')).replace('pandoc', '').trim();
  return semver.parse(version);
}