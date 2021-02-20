import Stylify from './Stylify.browser';
import { compilerConfig } from '../es5/Configurations/NativeConfiguration';

export default (
	Stylify.configure({
		compiler: compilerConfig
	})
);
