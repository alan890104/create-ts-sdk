#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import inquirer from 'inquirer';
import chalk from 'chalk';
import ora from 'ora';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper function to run shell commands
const runCommand = (command: string, cwd: string = process.cwd()) => {
  try {
    execSync(command, { stdio: 'inherit', cwd });
  } catch (error) {
    console.error(chalk.red(`Error running command: ${command}`));
    throw error;
  }
};

// Copy template files and replace placeholders
const copyTemplate = (srcDir: string, destDir: string, fullName: string) => {
  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
  }
  const entries = fs.readdirSync(srcDir, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(srcDir, entry.name);
    let destPath = path.join(destDir, entry.name);

    if (entry.name === 'gitignore.template') {
      destPath = path.join(destDir, '.gitignore');
    }

    if (entry.isDirectory()) {
      copyTemplate(srcPath, destPath, fullName);
    } else {
      const content = fs.readFileSync(srcPath, 'utf8');
      const updatedContent = content.replace(/{{SDK_NAME}}/g, fullName);
      fs.writeFileSync(destPath, updatedContent);
    }
  }
};

const parseName = (input: string) => {
  if (input.startsWith('@')) {
    const [org, sdk] = input.split('/');
    if (!sdk) {
      throw new Error('Invalid input format. Use @organization/sdk or just sdk.');
    }
    return { organization: org, sdkName: sdk };
  }
  return { organization: '', sdkName: input };
};

const main = async () => {
  const args = process.argv.slice(2);
  let organization: string | undefined;
  let sdkName: string;

  if (args.length > 0) {
    try {
      ({ organization, sdkName } = parseName(args[0] as string));
    } catch (error: unknown) {
      console.error(chalk.red((error as Error).message));
      process.exit(1);
    }
  } else {
    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'fullName',
        message: 'Enter the full name (e.g., @organization/sdk) or just the SDK name:',
        validate: (input) => {
          try {
            parseName(input);
            return true;
          } catch (error: unknown) {
            return (error as Error).message;
          }
        },
      },
    ]);
    ({ organization, sdkName } = parseName(answers.fullName));
  }

  const fullName = organization ? `${organization}/${sdkName}` : sdkName;
  const projectName = organization ? `${organization.replace('@', '')}-${sdkName}` : sdkName;
  const targetDir = path.resolve(process.cwd(), projectName);

  if (fs.existsSync(targetDir)) {
    console.error(chalk.red(`Directory ${projectName} already exists!`));
    process.exit(1);
  }

  const spinner = ora(`Creating project ${projectName}...`).start();

  try {
    const templateDir = path.resolve(__dirname, '../template');
    copyTemplate(templateDir, targetDir, fullName);

    spinner.text = 'Installing dependencies...';
    runCommand('pnpm install', targetDir);

    spinner.text = 'Installing changesets...';
    runCommand('pnpm add @changesets/cli', targetDir);
    runCommand('pnpm changeset init', targetDir);

    spinner.text = 'Initializing git...';
    runCommand('git init', targetDir);

    spinner.text = 'Setting up Husky...';
    runCommand('pnpm exec husky init', targetDir);

    const preCommitHook = `#!/bin/sh
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"

pnpm format
pnpm lint:fix
`;
    fs.writeFileSync(path.join(targetDir, '.husky/pre-commit'), preCommitHook, { mode: 0o755 });

    spinner.succeed(`Project ${projectName} created successfully!`);
    console.log(chalk.green(`\nNext steps:`));
    console.log(`  cd ${projectName}`);
    console.log(`  pnpm install`);
    console.log(`  pnpm dev\n`);
  } catch (error) {
    spinner.fail('Failed to create project.');
    console.error(chalk.red(error));
    process.exit(1);
  }
};

main();
