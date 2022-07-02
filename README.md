<br><br>

<p align="center">
	<a href="https://stylifycss.com" target="_blank" rel="noopener noreferrer">
		<img src="https://stylifycss.com/images/logo.svg" height="100" alt="Stylify logo">
	</a>
</p>

<br><br>

<p align="center">
<a href="https://discord.gg/NuJsk5SMDz"><img src="https://img.shields.io/badge/chat-on%20discord-7289da.svg?sanitize=true" alt="Chat"></a>
<a href="https://github.com/stylify/packages/discussions"><img src="https://user-images.githubusercontent.com/14016808/132510133-76bb66a9-951f-4411-9236-140cac7b7472.png"></a>
<a href="https://github.com/stylify/packages/blob/master/LICENSE"><img alt="GitHub" src="https://img.shields.io/github/license/stylify/packages"></a>
<br>
<a href="(https://github.com/stylify/packages/actions/workflows/tests.yaml"><img alt="GitHub Workflow Status (branch)" src="https://github.com/stylify/packages/actions/workflows/tests.yaml/badge.svg"></a>
<a href="https://codecov.io/gh/stylify/packages"><img src="https://codecov.io/gh/stylify/packages/branch/master/graph/badge.svg?token=ZJLKX877DF"/></a>
</p>

## Introduction

Stylify is a library that generates utility-first CSS dynamically based on what you write.<br>
Write HTML. Get CSS

<img src="https://raw.githubusercontent.com/stylify/packages/master/stylify-intro.gif" height="494" width="1024" alt="Stylify preview">

<p align="center"><a href="https://stylifycss.com"><img src="https://user-images.githubusercontent.com/14016808/132552680-ae877b45-5796-42df-b507-c0f6b9cf4706.png"></a></p>

### Want to know more?
- Live examples and tutorials can be found in [documentation](https://stylifycss.com/docs/get-started).
- Information about each release can be found in [releases](https://github.com/stylify/packages/releases).
- Have an idea? Found a bug? Feel free to create an [issue](https://github.com/stylify/packages/issues).

#### Compatibility
| Environment | Version                                                                                                                                                          | Note                                                                                                          |
|-------------|------------------------------------------------------------------------------------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------------------|
| Browser     | [ES5-compliant browsers](https://caniuse.com/?search=ES5), [Intersection Observer support](https://caniuse.com/?search=intersection%20observer) is required.     | Stylify doesn't need to be included in the browser. All CSS can be pregenerated on server or during a build.  |
| Node        | >= 14                                                                                                                                                            | In case Stylify will be used during an application build or in an SSR application.                            |

## Packages

| Project               | Status                                                       | Description                                                                          |
| --------------------- | ------------------------------------------------------------ | -------------------------------------------------------------------------------------|
| [autoprefixer]        | [![autoprefixer-status]][autoprefixer-package]               | [PostCSS Autoprefixer](https://github.com/postcss/autoprefixer) integration for SSR. |
| [bundler]             | [![bundler-status]][autoprefixer-package]                    | A flexible CSS bundler.                                                              |
| [nuxt]                | [![nuxt-status]][nuxt-package]                               | Module for [Nuxt.js Framework](https://nuxtjs.org/) v3+.                             |
| [nuxt-module]         | [![nuxt-module-status]][nuxt-module-package]                 | Module for [Nuxt.js Framework](https://nuxtjs.org/) v2 < v3.                         |
| [profiler]            | [![profiler-status]][profiler-package]                       | Profiler for Stylify packages.                                                       |
| [stylify]             | [![stylify-status]][stylify-package]                         | Core package. Generates CSS and minifies selectors.                                  |
| [unplugin]            | [![unplugin-status]][unplugin-package]                       | Universal plugin for Vite, Webpack, Rollup and Esbuildn.                             |

[autoprefixer]: https://github.com/stylify/packages/autoprefixer
[autoprefixer-status]: https://img.shields.io/npm/v/@stylify/autoprefixer.svg
[autoprefixer-package]: https://npmjs.com/package/@stylify/stylify

[bundler]: https://github.com/stylify/packages/bundler
[bundler-status]: https://img.shields.io/npm/v/@stylify/bundler.svg
[bundler-package]: https://npmjs.com/package/@stylify/bundler

[nuxt]: https://github.com/stylify/packages/nuxt
[nuxt-status]: https://img.shields.io/npm/v/@stylify/nuxt.svg
[nuxt-package]: https://npmjs.com/package/@stylify/nuxt

[nuxt-module]: https://github.com/stylify/packages/nuxt-module
[nuxt-module-status]: https://img.shields.io/npm/v/@stylify/nuxt-module.svg
[nuxt-module-package]: https://npmjs.com/package/@stylify/nuxt-module

[profiler]: https://github.com/stylify/packages/profiler
[profiler-status]: https://img.shields.io/npm/v/@stylify/profiler.svg
[profiler-package]: https://npmjs.com/package/@stylify/profiler

[stylify]: https://github.com/stylify/packages/stylify
[stylify-status]: https://img.shields.io/npm/v/@stylify/stylify.svg
[stylify-package]: https://npmjs.com/package/@stylify/stylify

[unplugin]: https://github.com/stylify/packages/unplugin
[unplugin-status]: https://img.shields.io/npm/v/@stylify/unplugin.svg
[unplugin-package]: https://npmjs.com/package/@stylify/unplugin

## Stay In Touch

- Visit Stylify website [https://stylifycss.com](https://stylifycss.com).
- Follow Stylify on [Twitter](https://twitter.com/stylify_dev).
- Join Stylify community on [Discord](https://discord.gg/NuJsk5SMDz).

## License

[MIT](https://opensource.org/licenses/MIT)

Copyright (c) 2021-present, Vladimír Macháček
