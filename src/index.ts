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

// Copy directory recursively with placeholder replacement
const copyTemplate = (srcDir: string, destDir: string, sdkName: string) => {
  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
  }
  const entries = fs.readdirSync(srcDir, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(srcDir, entry.name);
    const destPath = path.join(destDir, entry.name);

    if (entry.isDirectory()) {
      copyTemplate(srcPath, destPath, sdkName); // Recursive call for directories
    } else {
      // Read file content and replace placeholders
      const content = fs.readFileSync(srcPath, 'utf8');
      const updatedContent = content.replace(/{{SDK_NAME}}/g, sdkName);
      fs.writeFileSync(destPath, updatedContent); // Write the updated content to destination
    }
  }
};

const main = async () => {
  const { sdkName } = await inquirer.prompt([
    {
      type: 'input',
      name: 'sdkName',
      message: 'Enter the SDK name:',
      validate: (input) =>
        /^[a-zA-Z0-9-_]+$/.test(input) ? true : 'Invalid name. Use only letters, numbers, dashes, and underscores.',
    },
  ]);

  const projectName = `${sdkName}-sdk`;
  const targetDir = path.resolve(process.cwd(), projectName);

  if (fs.existsSync(targetDir)) {
    console.error(chalk.red(`Directory ${projectName} already exists!`));
    process.exit(1);
  }

  const spinner = ora(`Creating project ${projectName}...`).start();

  try {
    // Step 1: Copy template files with dynamic replacement
    const templateDir = path.resolve(__dirname, '../template');
    copyTemplate(templateDir, targetDir, sdkName);

    // Step 2: Install dependencies
    spinner.text = 'Installing dependencies...';
    runCommand('pnpm install', targetDir);

    spinner.text = 'Installing changesets...';
    runCommand('pnpm add @changesets/cli', targetDir);
    runCommand('pnpm changeset init', targetDir);

    spinner.text = 'Initializing git...';
    runCommand('git init', targetDir);

    // Setup Husky
    spinner.text = 'Setting up Husky...';
    runCommand('pnpm exec husky init', targetDir);

    // Add pre-commit hook
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
