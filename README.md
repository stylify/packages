<br><br>

<p align="center">
	<a href="https://stylify.dev" target="_blank" rel="noopener noreferrer">
		<img src="./stylify-logo.png" height="100" alt="Stylify logo">
	</a>
</p>

<br><br>

<p align="center">
<a href="https://discord.gg/NuJsk5SMDz/"><img src="https://img.shields.io/badge/chat-on%20discord-7289da.svg?sanitize=true" alt="Chat"></a>
<a href="https://github.com/stylify/packages/discussions"><img src="https://user-images.githubusercontent.com/14016808/132510133-76bb66a9-951f-4411-9236-140cac7b7472.png"></a>
<a href="https://github.com/stylify/packages/blob/master/LICENSE"><img alt="GitHub" src="https://img.shields.io/github/license/stylify/packages"></a>
<br>
<a href="https://github.com/stylify/packages/actions/workflows/tests.yaml?query=branch%3Amaster"><img alt="GitHub Workflow Status (branch)" src="https://img.shields.io/github/workflow/status/stylify/packages/tests/master"></a>
<a href="https://codecov.io/gh/stylify/packages"><img src="https://codecov.io/gh/stylify/packages/branch/master/graph/badge.svg?token=ZJLKX877DF"/></a>
</p>

## Introduction
Stylify is a library that generates CSS dynamically based on what you write.

Imagine you want to have an element that changes font size according to screen size. Normally you would write something like this:

```html
<style>
.text { font-size: 16px }

@media (min-width: 640px) {
 .text { font-size: 24px }
}
</style>

<p class="text">Hello World!</p>
```

With the Stylify, **you write HTML** and the **Stylify will generate the CSS** for you.

```html
<p class="font-size:16px md:font-size:24px">Hello World!</p>
```

Generated CSS from the example above looks like this:

```html
<style id="stylify-css">
.font-size\:16px { font-size: 16px }

@media (min-width: 640px) {
 .font-size\:24px { font-size: 24px }
}
</style>
```

<p align="center"><a href="https://stylify.dev"><img src="https://user-images.githubusercontent.com/14016808/132552680-ae877b45-5796-42df-b507-c0f6b9cf4706.png"></a></p>

### Want to know more?
- Live examples and tutorials can be found in [documentation](https://stylify.dev).
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
| [stylify]             | [![stylify-status]][stylify-package]                         | Dynamic CSS generator, Profiler and Selectors Minifier.                              |
| [autoprefixer]        | [![autoprefixer-status]][autoprefixer-package]               | [PostCSS Autoprefixer](https://github.com/postcss/autoprefixer) integration for SSR. |
| [nuxt-module]         | [![nuxt-module-status]][nuxt-module-package]                 | Module for [Nuxt Framework](https://nuxtjs.org/).                                    |

[stylify]: https://github.com/stylify/packages/stylify
[stylify-status]: https://img.shields.io/npm/v/@stylify/stylify.svg
[stylify-package]: https://npmjs.com/package/@stylify/stylify

[autoprefixer]: https://github.com/stylify/packages/autoprefixer
[autoprefixer-status]: https://img.shields.io/npm/v/@stylify/autoprefixer.svg
[autoprefixer-package]: https://npmjs.com/package/@stylify/stylify

[nuxt-module]: https://github.com/stylify/packages/nuxt-module
[nuxt-module-status]: https://img.shields.io/npm/v/@stylify/nuxt-module.svg
[nuxt-module-package]: https://npmjs.com/package/@stylify/nuxt-module

## Stay In Touch

- Visit Stylify website [https://stylify.dev](https://stylify.dev).
- Follow Stylify on [Twitter](https://twitter.com/stylify_dev).
- Join Stylify community on [Discord](https://https://discord.gg/NuJsk5SMDz/).

## License

[MIT](https://opensource.org/licenses/MIT)

Copyright (c) 2021-present, Vladimír Macháček
