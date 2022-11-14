# Stylify CSS Contributing Guide

Hi! I'm excited that you are interested in contributing to Stylify CSS.
Before submitting your contribution, please make sure to take a moment and read through the following guidelines:

- [Code of Conduct](https://github.com/stylify/packages/blob/master/.github/CODE_OF_CONDUCT.md)
- [Pull Request Guidelines](#pull-request-guidelines)
- [Development Setup](#development-setup)
- [Project Structure](#project-structure)

## Issue Reporting Guidelines

- Always use [Github Issues](https://github.com/stylify/packages/issues) to create new issues.
- In case of discussion, checkout [Github Discussions](https://github.com/stylify/packages/discussions) or our [Discord Channel](https://discord.gg/NuJsk5SMDz).

## Pull Request Guidelines

- Submit pull requests against the `master` branch
- It's OK to have multiple small commits as you work on the PR. Try to split them into logical units (so the changes in commit makes sense).
- Make sure `tests` passes (see [development setup](#development-setup))

- If adding a new feature:
  - Add accompanying test case.
  - Provide a convincing reason to add this feature. Ideally, you should open a suggestion issue first and have it approved before working on it.

- If fixing bug:
  - If you are resolving a special issue, add `(fix #xxxx[,#xxxx])` (#xxxx is the issue id) in your PR title for a better release log, e.g. `Update @stylify/stylify compiler (fix #3899)`.
  - Provide a detailed description of the bug in the PR. Live demo preferred.
  - Add appropriate test coverage if applicable.

## Development Setup
- You will [Node.js](http://nodejs.org) >= 16 and [Yarn](https://yarnpkg.com/)
- After cloning the repo, run `yarn i`. This will install dependencies
- You can use `Docker Setup` in this repository through `Docker Compose` or `Visual Studio Dev Containers`.

### Committing Changes

- Commit messages should be self explanatory like `Added someMethod into @stylify/stylify Compiler`.
- Avoid messages like `Fix, Clenup, Revert, Change, Tunning` and similar.

### NPM scripts
- There are following tasks defined in the root `package.json`:
  - `build`: builds all packages, generates types
  - `watch`: watches all packages for change
  - `jest:test`:  runs all jest tests defined in `packages/<package>/tests/jest`
- In case of making changes only in one package, you can speed up the `watch/build/test` process by running specific command like `stylify:build/watch/test`
- Some packages also have playground, where you can test the changes. You need to move the cli into that directory and run `yarn i` to install dependencies. Each playground contains `readme file` on how to use it.

## Project Structure

- **`scripts`**: Mainly for build commands
- **`packages`**: Contains all packages
  - **`packages/*/tests`**: Contains tests for a specific package
  - **`packages/*/tmp`**: Temporary files for tests, build and etc
  - **`packages/*/src`**: Source code of that package
  - **`packages/*/types`**: Typescript types
  - **`packages/*/lib|dist|esm`**: Generated output of the package

## Financial Contribution

In case you use Stylify CSS or like the idea, you can also contribute financially on [Sponsor Page](https://github.com/sponsors/Machy8). Every donation is more then welcome :).

## Credits

Thank you to [all the people who have already contributed](https://github.com/stylify/packages/graphs/contributors) to Stylify CSS!
