import { defineConfig } from '@stylify/bundler';
import { nativePreset } from '@stylify/stylify';

export default defineConfig({
	compiler: nativePreset.compiler
});
