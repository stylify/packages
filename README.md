<br>

<p align="center">
	<a href="https://stylifycss.com" target="_blank" rel="noopener noreferrer">
		<img src="https://stylifycss.com/images/logo/horizontal.svg" height="100" alt="Stylify logo">
	</a>
</p>

<br>

<p align="center">
<a href="https://discord.gg/NuJsk5SMDz"><img src="https://img.shields.io/badge/chat-on%20discord-7289da.svg?sanitize=true" alt="Chat"></a>
<a href="https://github.com/stylify/packages/discussions"><img src="https://user-images.githubusercontent.com/14016808/132510133-76bb66a9-951f-4411-9236-140cac7b7472.png"></a>
<a href="https://twitter.com/stylifycss"><img alt="Twitter Follow" src="https://img.shields.io/twitter/follow/stylifycss?style=social"></a>
<a href="https://github.com/stylify/packages"><img alt="GitHub Org's stars" src="https://img.shields.io/github/stars/stylify/packages?style=social"></a>
<a href="https://github.com/stylify/packages/blob/master/LICENSE"><img alt="GitHub" src="https://img.shields.io/github/license/stylify/packages"></a>
<br>
<a href="(https://github.com/stylify/packages/actions/workflows/tests.yaml"><img alt="GitHub Workflow Status (branch)" src="https://github.com/stylify/packages/actions/workflows/tests.yaml/badge.svg"></a>
<a href="https://codecov.io/gh/stylify/packages"><img src="https://codecov.io/gh/stylify/packages/branch/master/graph/badge.svg?token=ZJLKX877DF"/></a>
<a href="https://github.com/stylify/packages/issues"><img alt="GitHub issues" src="https://img.shields.io/github/issues/stylify/packages"></a>
<a href="https://github.com/stylify/packages"><img alt="GitHub commit activity" src="https://img.shields.io/github/commit-activity/m/stylify/packages"></a>
<a href="https://github.com/stylify/packages/releases"><img alt="GitHub release (latest by date)" src="https://img.shields.io/github/v/release/stylify/packages"></a>
<a href="https://github.com/stylify/packages"><img alt="GitHub contributors" src="https://img.shields.io/github/contributors/stylify/packages"></a>
</p>

## 💎 Introduction

Stylify is a library that uses CSS-like selectors to generate utility-first CSS dynamically based on what you write.<br> 
Don't study framework. Focus on coding.

<p align="center">
<img src="https://raw.githubusercontent.com/stylify/packages/master/stylify-intro-v2.gif" alt="Stylify preview">
</p>

## ✨ Features

- 🔗 Define [Variables](https://stylifycss.com/docs/stylify/compiler#variables), [Components](https://stylifycss.com/docs/stylify/compiler#components), [Custom selectors](https://stylifycss.com/docs/stylify/compiler#customselectors)
- 🔁 [Add custom macros](https://stylifycss.com/docs/stylify/compiler#macros) like ml:2
- 💲 Variables can be injected into css as CSS variables
- 🌃 CSS [variables can differ for each screen](https://stylifycss.com/docs/stylify/compiler#variables)
- 🖌️ Simplify coding with [helpers](https://stylifycss.com/docs/stylify/compiler#helpers) like `color:lighten(#000,10)`
- 🖥️ Style any device with dynamic [screens](https://stylifycss.com/docs/stylify/compiler#screens)
- ✋ You can mark areas for which CSS should not be
- 📦 Split bundles for page/layout/component
- 🧰 Selectors are minified from long .color:blue to short .a
- ✨ No purge needed. CSS is generated only when something is matched
- 🔗 Components & Custom selectors are attached to utilities. No duplicated property:value
- 🪝 Hooks can modify CSS or output for example wrap it in CSS layers
- 👀 Mangled (hidden/unreadable) HTML classes in production (if mangled)
- 🚀 [Try it with frameworks](https://stylifycss.com/docs/integrations) like, Next.js, Astro. SolidJS, Qwik Symfony, Nette, Laravel
- ⚒️ Works with bundlers like Webpack, Rollup, Vite.js
- ⛓️ Generated CSS can be used within SCSS, Less, Stylus
- 🎨 CSS variables can be exported into external file and reused

<p align="center"><a href="https://stylifycss.com"><img src="https://user-images.githubusercontent.com/14016808/132552680-ae877b45-5796-42df-b507-c0f6b9cf4706.png"></a></p>

## 📦 Packages

| Project               | Status                                                       | Description                                                                          |
| --------------------- | ------------------------------------------------------------ | -------------------------------------------------------------------------------------|
| [astro]               | [![astro-status]][astro-package]                             | Integration for Astro.build                                                              |
| [bundler]             | [![bundler-status]][bundler-package]                         | A flexible CSS bundler.                                                              |
| [nuxt]                | [![nuxt-status]][nuxt-package]                               | Module for [Nuxt.js Framework](https://nuxtjs.org/) v3+.                             |
| [nuxt-module]         | [![nuxt-module-status]][nuxt-module-package]                 | Module for [Nuxt.js Framework](https://nuxtjs.org/) v2 < v3.                         |
| [stylify]             | [![stylify-status]][stylify-package]                         | Core package. Generates CSS and minifies selectors.                                  |
| [unplugin]            | [![unplugin-status]][unplugin-package]                       | Universal plugin for Vite, Webpack, Rollup and Esbuildn.                             |

[astro]: https://github.com/stylify/packages/tree/master/packages/astro
[astro-status]: https://img.shields.io/npm/v/@stylify/astro?color=%2301befe&label=Version&style=for-the-badge
[astro-package]: https://npmjs.com/package/@stylify/astro

[bundler]: https://github.com/stylify/packages/tree/master/packages/bundler
[bundler-status]: https://img.shields.io/npm/v/@stylify/bundler?color=%2301befe&label=Version&style=for-the-badge
[bundler-package]: https://npmjs.com/package/@stylify/bundler

[nuxt]: https://github.com/stylify/packages/tree/master/packages/nuxt
[nuxt-status]: https://img.shields.io/npm/v/@stylify/nuxt?color=%2301befe&label=Version&style=for-the-badge
[nuxt-package]: https://npmjs.com/package/@stylify/nuxt

[nuxt-module]: https://github.com/stylify/packages/tree/master/packages/nuxt-module
[nuxt-module-status]: https://img.shields.io/npm/v/@stylify/nuxt-module?color=%2301befe&label=Version&style=for-the-badge
[nuxt-module-package]: https://npmjs.com/package/@stylify/nuxt-module

[stylify]: https://github.com/stylify/packages/tree/master/packages/stylify
[stylify-status]: https://img.shields.io/npm/v/@stylify/stylify?color=%2301befe&label=Version&style=for-the-badge
[stylify-package]: https://npmjs.com/package/@stylify/stylify

[unplugin]: https://github.com/stylify/packages/tree/master/packages/unplugin
[unplugin-status]: https://img.shields.io/npm/v/@stylify/unplugin?color=%2301befe&label=Version&style=for-the-badge
[unplugin-package]: https://npmjs.com/package/@stylify/unplugin

#### Compatibility
| Environment | Version                                                                                                                                                          | Note                                                                                                          |
|-------------|------------------------------------------------------------------------------------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------------------|
| Browser     | [ES5-compliant browsers](https://caniuse.com/?search=ES5), [Intersection Observer support](https://caniuse.com/?search=intersection%20observer) is required.     | Stylify doesn't need to be included in the browser. All CSS can be pregenerated on server or during a build.  |
| Node        | >= 14                                                                                                                                                            | In case Stylify will be used during an application build or in an SSR application.                            |

## 💡 Examples, Changelog, Issues
- Live examples and tutorials: [documentation](https://stylifycss.com/docs/get-started)
- Changelog and release changes: [releases](https://github.com/stylify/packages/releases)
- Have an idea? Found a bug? Feel free to create an [issue](https://github.com/stylify/packages/issues)

## 🤟 Stay In Touch

- Visit Stylify website [https://stylifycss.com](https://stylifycss.com).
- Follow Stylify on [Twitter](https://twitter.com/stylify_dev).
- Join Stylify community on [Discord](https://discord.gg/NuJsk5SMDz).

## 👷 Contributing
Please make sure to read the [Contributing Guide](https://github.com/stylify/packages/blob/master/.github/CODE_OF_CONDUCT.md) before making a pull request.

## 📝 License

[MIT](https://opensource.org/licenses/MIT)

Copyright (c) 2021-present, Vladimír Macháček
