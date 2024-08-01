import path from 'path';
import fs from 'fs-extra';
import { promisify } from 'util';
import { exec } from 'child_process';
import Listr from 'listr';
import chalk from 'chalk';
import nunjucks from 'nunjucks';
import { ValidationError } from 'yup';
import { getPathToNodeModulesRoot } from '../../utils/path';
import { CliOptions } from './cli-options-interface';
import { addScript, removeScript } from './add-remove-script-package-json';

export class CreateExampleProject {
  private automationsDirectoryPath: string;

  private exampleTemplateDirectoryName = 'askui_example';

  private automationsDirectoryName: string;

  private projectRootDirectoryPath: string;

  private askUIControllerUrl: string;

  private helperTemplateConfig: { [key: string]: string };

  constructor(readonly cliOptions: CliOptions) {
    this.projectRootDirectoryPath = process.cwd();

    this.automationsDirectoryName = this.getAutomationsDirectoryName();
    this.automationsDirectoryPath = path.join(
      this.projectRootDirectoryPath,
      this.automationsDirectoryName,
    );

    this.askUIControllerUrl = 'https://docs.askui.com/docs/general/Components/AskUI-Controller';
    this.helperTemplateConfig = {};
  }

  private getAutomationsDirectoryName(): string {
    if (this.cliOptions.automationsDirectory) {
      if (/\s/g.test(this.cliOptions.automationsDirectory.trim())) {
        throw new ValidationError('Automations directory (-ad, --automations-directory) must not contain whitespaces');
      }
      return this.cliOptions.automationsDirectory.trim();
    }
    return this.exampleTemplateDirectoryName;
  }

  private async copyTemplateProject(): Promise<Listr.ListrTask<unknown>[]> {
    const exampleProjectPath = path.join(
      'example_projects_templates',
      'typescript',
      this.exampleTemplateDirectoryName,
    );

    const runCommand = promisify(exec);

    return [
      {
        title: 'Detect Operating System',
        task: async () => {
          if (process.platform === 'win32') {
            this.cliOptions.operatingSystem = 'windows';
          } else if (process.platform === 'darwin') {
            this.cliOptions.operatingSystem = 'macos';
          } else if (
            process.platform === 'linux'
              || process.platform === 'freebsd'
              || process.platform === 'openbsd'
          ) {
            this.cliOptions.operatingSystem = 'linux';
          } else {
            throw new Error(`The detected operating system is ${process.platform}. We only support 'windows', 'macos' and 'linux'`);
          }
        },
      },
      {
        title: 'Copy project files',
        task: async () => fs.copy(
          path.join(getPathToNodeModulesRoot(), exampleProjectPath),
          this.automationsDirectoryPath,
        ),
      },
      {
        title: 'Install askui dependency',
        task: async () => {
          await runCommand('npm init -y');
          await removeScript(`${this.projectRootDirectoryPath}/package.json`, 'test');
          await runCommand('npm i -D askui ');
        },
      },
    ];
  }

  private async copyTestFrameworkConfig() {
    const frameworkConfigs = {
      jest: 'jest.config.ts',
    };
    const configFilePath = path.join(
      getPathToNodeModulesRoot(),
      'example_projects_templates',
      'configs',
      frameworkConfigs.jest,
    );
    await fs.copyFile(configFilePath, path.join(
      this.automationsDirectoryPath,
      frameworkConfigs.jest,
    ));
  }

  private async addTestFrameWorkTimeout() {
    const frameworkTimeoutstring = {
      jest: 'jest.setTimeout(60 * 1000 * 60);',
    };
    this.helperTemplateConfig['timeout_placeholder'] = frameworkTimeoutstring.jest;
  }

  private async addReporterConfig() {
    this.helperTemplateConfig['allure_stepreporter_import'] = "import { AskUIAllureStepReporter } from '@askui/askui-reporters';";
    this.helperTemplateConfig['reporter_placeholder'] = 'reporter: new AskUIAllureStepReporter(),';
    this.helperTemplateConfig['allure_stepreporter_attach_video'] = `const video = await aui.readVideoRecording();
  await AskUIAllureStepReporter.attachVideo(video);`;
  }

  private async addAskuiRunCommand() {
    const frameworkExecutionCommand = {
      jest: `jest --config ./${this.automationsDirectoryName}/jest.config.ts --runInBand`,
    };
    await addScript(
      `${this.projectRootDirectoryPath}/package.json`,
      'askui',
      frameworkExecutionCommand.jest,
    );
  }

  private async addESLintRunCommand() {
    await addScript(
      `${this.projectRootDirectoryPath}/package.json`,
      'lint',
      'eslint . --ext .ts',
    );
  }

  private async createAskUIHelperFromTemplate() {
    return [{
      title: 'Write askui config',
      task: async () => new Listr([
        {
          title: 'Create askui-helper.ts ',
          task: async () => {
            const askuiHelperTemplateFilePath = path.join(
              getPathToNodeModulesRoot(),
              'example_projects_templates',
              'templates',
            );

            let templateFileName = 'askui-helper.nj';
            if (this.cliOptions.operatingSystem === 'windows') {
              templateFileName = 'askui-helper-windows.nj';
            }

            nunjucks.configure(askuiHelperTemplateFilePath, { autoescape: false });
            const result = nunjucks.render(templateFileName, this.helperTemplateConfig);
            const filePath = path.join(this.automationsDirectoryPath, 'helpers', 'askui-helper.ts');
            if (!fs.existsSync(path.join(this.automationsDirectoryPath, 'helpers'))) {
              await fs.mkdir(path.join(this.automationsDirectoryPath, 'helpers'));
            }
            await fs.writeFile(filePath, result, 'utf8');
          },
        },
      ]),
    }];
  }

  private async setupTestFrameWork() {
    return [{
      title: 'Setup Test framework',
      task: async () => new Listr([
        {
          title: 'Install jest',
          task: async () => CreateExampleProject.installTestFrameworkPackages(),
        },
        {
          title: 'Copy config file',
          task: async () => this.copyTestFrameworkConfig(),
        },
        {
          title: 'Add timeout',
          task: async () => this.addTestFrameWorkTimeout(),
        },
        {
          title: 'Add reporter',
          task: async () => this.addReporterConfig(),
        },
        {
          title: 'Add askui run command',
          task: async () => this.addAskuiRunCommand(),
        },
        {
          title: 'Add eslint run command',
          task: async () => this.addESLintRunCommand(),
        },
      ]),
    }];
  }

  private static async installTestFrameworkPackages(): Promise<void> {
    const runCommand = promisify(exec);
    const frameworkDependencies = {
      jest: 'npm i -D @askui/askui-reporters typescript ts-node @types/jest ts-jest jest @askui/jest-allure-circus eslint @typescript-eslint/parser @typescript-eslint/eslint-plugin eslint-plugin-import @askui/eslint-plugin-askui hpagent',
    };
    await runCommand(frameworkDependencies.jest);
  }

  private async addUserCredentials() {
    return [
      {
        /* eslint-disable sort-keys */
        title: 'Add user credentials',
        enabled: () => !this.cliOptions.skipCredentials,
        task: async () => {
          this.helperTemplateConfig['credentials'] = ` credentials: {
        workspaceId: '${this.cliOptions.workspaceId}',
        token: '${this.cliOptions.accessToken}',
      },`;
        },
      },
      /* eslint-enable */
    ];
  }

  private async copyESLintConfigFiles(): Promise<Listr.ListrTask<unknown>[]> {
    const esLintRcFilePath = path.join('example_projects_templates', 'typescript', '.eslintrc.json-template');
    const esLintIgnoreFilePath = path.join('example_projects_templates', 'typescript', '.eslintignore-template');

    return [{
      title: 'Copy ESLint config files',
      task: async () => new Listr([
        {
          title: 'Add eslintrc.json',
          task: async () => fs.copyFile(
            path.join(getPathToNodeModulesRoot(), esLintRcFilePath),
            path.join(this.projectRootDirectoryPath, '.eslintrc.json'),
          ),
        },
        {
          title: 'Add .eslintignore',
          task: async () => fs.copyFile(
            path.join(getPathToNodeModulesRoot(), esLintIgnoreFilePath),
            path.join(this.projectRootDirectoryPath, '.eslintignore'),
          ),
        },
      ]),
    },
    ];
  }

  private async copyGitignore(): Promise<Listr.ListrTask<unknown>[]> {
    const gitignoreFilePath = path.join('example_projects_templates', 'typescript', 'gitignore');

    return [{
      title: 'Copy .gitignore',
      task: async () => new Listr([
        {
          title: 'Add .gitignore',
          task: async () => fs.copyFile(
            path.join(getPathToNodeModulesRoot(), gitignoreFilePath),
            path.join(this.projectRootDirectoryPath, '.gitignore'),
          ),
        },
      ]),
    },
    ];
  }

  private async copyTsConfigFile(): Promise<Listr.ListrTask<unknown>[]> {
    const tsConfigFilePath = path.join(
      'example_projects_templates',
      'typescript',
      'tsconfig.json',
    );
    const tsConfigTargetFilePath = path.join(this.projectRootDirectoryPath, 'tsconfig.json');
    /* eslint-disable sort-keys */
    return [
      {
        title: 'Copy ts config file',
        enabled: () => this.cliOptions.typescriptConfig || !fs.existsSync(tsConfigTargetFilePath),
        task: async () => fs.copyFile(
          path.join(getPathToNodeModulesRoot(), tsConfigFilePath),
          tsConfigTargetFilePath,
        ),
      },
    ];
  }
  /* eslint-enable */

  public async createExampleProject(): Promise<void> {
    const tasks = new Listr();

    tasks.add([
      ...(await this.copyTemplateProject()),
      ...(await this.setupTestFrameWork()),
      ...(await this.copyESLintConfigFiles()),
      ...(await this.copyGitignore()),
      ...(await this.copyTsConfigFile()),
      ...(await this.addUserCredentials()),
      ...(await this.createAskUIHelperFromTemplate()),
    ]);

    await tasks.run();
    /* eslint-disable no-console */
    console.log(chalk.greenBright('\nCongratulations!'));
    console.log(
      `askui example was created under ${chalk.gray(
        this.automationsDirectoryPath,
      )}`,
    );

    if (this.cliOptions.operatingSystem === 'windows') {
      console.log(
        chalk.redBright(
          `\nPlease make sure the AskUI Controller is running: ${this.askUIControllerUrl}\n`,
        ),
      );
      console.log(
        `You can start your automation with this command ${chalk.green(
          'AskUI-RunProject',
        )}`,
      );
    } else {
      console.log(
        `You can start your automation with this command ${chalk.green(
          'npm run askui',
        )}`,
      );
    }
    /* eslint-enable no-console */
  }
}
