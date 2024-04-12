import os from 'os';
import { AnalyticsInterface } from './analytics-interface';
import { UserIdentifierInterface } from './user-identifier-interface';
import { UserIdentifier } from './user-identifier';
import { InstallationTimestamp } from './installation-timestamp';
import { Context } from '@/execution/context';

export class Analytics implements AnalyticsInterface {
  private userIdentifier: UserIdentifierInterface = new UserIdentifier();

  async getAnalyticsHeaders(context: Context): Promise<Record<string, string>> {
    const userID = await this.userIdentifier.userId();
    const headers: Record<string, string> = {
      'askui-is-ci': String(context.isCi),
      'askui-user-agent': `os:${os.platform()};arch:${os.arch()}`,
      'askui-user-id': userID,
    };

    const askuiInstalledAt = await InstallationTimestamp.get();
    if (askuiInstalledAt) {
      headers['askui-installed-at'] = askuiInstalledAt.toISOString();
    }

    return headers;
  }

  async getAnalyticsCookies(): Promise<Record<string, string>> {
    const userID = await this.userIdentifier.userId();
    return {
      'askui-user-id': userID,
    };
  }
}
