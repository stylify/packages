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
<a href="https://twitter.com/stylifycss"><img alt="Twitter Follow" src="https://img.shields.io/twitter/follow/stylifycss?style=social"></a>
<a href="https://github.com/stylify/packages"><img alt="GitHub Org's stars" src="https://img.shields.io/github/stars/stylify/packages?style=social"></a>
<a href="https://github.com/stylify/packages/blob/master/LICENSE"><img alt="GitHub" src="https://img.shields.io/github/license/stylify/packages"></a>
<br>
<a href="(https://github.com/stylify/packages/actions/workflows/tests.yaml"><img alt="GitHub Workflow Status (branch)" src="https://github.com/stylify/packages/actions/workflows/tests.yaml/badge.svg"></a>
<a href="https://codecov.io/gh/stylify/packages"><img src="https://codecov.io/gh/stylify/packages/branch/master/graph/badge.svg?token=ZJLKX877DF"/></a>
<a href="https://www.npmjs.com/package/@stylify/nuxt-module"><img alt="npm" src="https://img.shields.io/npm/v/@stylify/nuxt-module"></a>
<a href="https://www.npmjs.com/package/@stylify/nuxt-module"><img alt="npm" src="https://img.shields.io/npm/dm/@stylify/nuxt-module"></a>
<a href="https://github.com/stylify/packages/issues"><img alt="GitHub issues" src="https://img.shields.io/github/issues/stylify/packages"></a>
<a href="https://github.com/stylify/packages"><img alt="GitHub commit activity" src="https://img.shields.io/github/commit-activity/m/stylify/packages"></a>
<a href="https://github.com/stylify/packages/releases"><img alt="GitHub release (latest by date)" src="https://img.shields.io/github/v/release/stylify/packages"></a>
<a href="https://github.com/stylify/packages"><img alt="GitHub contributors" src="https://img.shields.io/github/contributors/stylify/packages"></a>
</p>

## @stylify/nuxt-module introduction

**Note:** *This plugin is for Nuxt 2 and older versions. For Nuxt 3 and newer versions see [@stylify/nuxt](https://github.com/stylify/packages/tree/master/packages/nuxt)*.

Stylify is a library that uses CSS-like selectors to generate utility-first CSS dynamically based on what you write.<br> 
Don't study framework. Focus on coding.

The Nuxt module is a package for symplifing the Stylify integration into the Nuxt.js.<br>
It automatically bundles CSS, mangles selectors and also provides a Stylify Profiler extension for easier development.

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

### Want to know more?
- Live examples and tutorials can be found in [documentation](https://stylifycss.com/docs/nuxt-module).
- Information about each release can be found in [releases](https://github.com/stylify/packages/releases).
- Have an idea? Found a bug? Feel free to create an [issue](https://github.com/stylify/packages/issues).

#### Compatibility
| Environment | Version |
|-------------|---------|
| Node        | >= 14   |
| Nuxt.js     | v2      |


## Stay In Touch

- Visit Stylify website [https://stylifycss.com](https://stylifycss.com).
- Follow Stylify on [Twitter](https://twitter.com/stylifycss).
- Join Stylify community on [Discord](https://discord.gg/NuJsk5SMDz).

## License

[MIT](https://opensource.org/licenses/MIT)

Copyright (c) 2021-present, Vladimír Macháček
