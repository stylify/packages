import {
	Card,
	CardTitle,
	ProfilerExtensionPropsInterface,
	TableWrapper,
	preact,
	utils
} from '@stylify/profiler';
import { BundleStatsInterface } from '../../module';

const { h } = preact;

interface ExpandableStateInterface {
	bundlesStats: BundleStatsInterface[];
	serializedCompilationResult: string;
}

export class NuxtProfilerExtension extends preact.Component<ProfilerExtensionPropsInterface, ExpandableStateInterface> {

	public static title = 'Nuxt';

	public static icon = `
		<svg version="1.1" xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
			<path fill="#00c58e" d="M841.557 864.939l0.981-1.92c0.811-1.408 1.574-3.056 2.192-4.772l0.069-0.22 0.085-0.213c1.949-5.106 3.078-11.012 3.078-17.181 0-3.081-0.282-6.097-0.82-9.022l0.047 0.304 0.043 0.299c-1.799-10.015-5.299-18.947-10.216-26.911l0.189 0.33 0.213 0.341-226.859-399.061-34.645-60.587-261.163 459.648c-4.141 7.448-7.188 16.121-8.646 25.323l-0.058 0.448-0.043 0.469c-0.537 2.85-0.844 6.129-0.844 9.479 0 7.564 1.566 14.763 4.392 21.289l-0.134-0.347-0.128-0.341c0.699 1.712 1.414 3.143 2.221 4.513l-0.088-0.161-0.085-0.171c6.827 11.733 21.333 25.685 53.333 25.685h422.315c6.699 0 39.467-1.365 54.571-27.221zM575.872 467.456l207.317 364.715h-414.549zM1013.163 805.973l-299.349-527.36c-3.072-5.547-20.352-33.579-50.432-33.579-13.525 0-32.939 5.76-48.725 33.493l-38.699 67.84 34.432 60.587 53.333-94.379 296.149 519.68h-112.64c0.438 2.502 0.689 5.383 0.689 8.323 0 6.327-1.16 12.383-3.279 17.966l0.116-0.348 0.128-0.341c-0.731 2.081-1.552 3.855-2.517 5.537l0.085-0.161 0.085-0.171-0.981 1.92c-15.147 25.813-47.872 27.179-54.272 27.179h176.171c6.485 0 39.125-1.365 54.272-27.179 6.699-11.733 11.52-31.445-4.565-59.008zM311.637 866.432c-0.595-1.039-1.238-2.328-1.814-3.653l-0.106-0.272-0.085-0.256c-2.792-6.2-4.419-13.44-4.419-21.061 0-3.294 0.304-6.516 0.885-9.641l-0.050 0.324-0.043 0.299h-241.963l359.637-632.832 118.059 207.531 34.219-60.587-102.912-181.291c-2.859-5.205-20.267-33.152-50.219-33.152-13.525 0-32.939 5.845-48.725 33.579l-364.288 640.512c-3.072 5.547-18.133 34.645-3.2 60.459 6.827 11.733 21.333 25.685 53.333 25.685h305.109c-31.787 0-46.507-13.739-53.419-25.643z"></path>
		</svg>
	`;

	constructor() {
		super();
		this.state = {
			bundlesStats: [],
			serializedCompilationResult: '{}'
		};

		this.setState(this.getActualStateData());
	}

	private getActualStateData(): ExpandableStateInterface {
		const data = utils.getProfilerDataFromPage('nuxtExtension') as ExpandableStateInterface;

		if (!data) {
			return;
		}

		data.bundlesStats = data.bundlesStats.sort((next, previous) => {
			return next.css.length > previous.css.length ? -1 : 0;
		});

		return data;
	}

	private openGeneratedCssInNewWindow = (css: string) => {
		utils.openCodeInNewWindow(css, 'css', 'Nuxt bundle CSS');
	};

	/* eslint-disable max-len */
	public render(): any {
		return (
			<preact.Fragment>
				<Card>
					<CardTitle><span>{`Builds (${this.state.bundlesStats.length})`}</span></CardTitle>
					<TableWrapper>
						<table>
							<thead>
								<tr>
									<th>File path</th>
									<th>Size</th>
									<th>Actions</th>
								</tr>
							</thead>
							<tbody>
								{this.state.bundlesStats.map((bundleStats) => {
									return (
										<tr>
											<td class="word-break:break-word width:320px">{bundleStats.resourcePath}</td>
											<td>{`Bundle size: ${utils.convertSizeToKb(bundleStats.css.length)}`}</td>
											<td>
												<a role="button" style="white-space:nowrap" onClick={() => this.openGeneratedCssInNewWindow(bundleStats.css)}>Show CSS</a>
												<span>&nbsp;|&nbsp;</span>
												<a href={`data:text/plain;charset=utf-8,${encodeURIComponent(bundleStats.css)}`} download="stylify-runtime-css.css" style="white-space:nowrap">Export CSS</a>
											</td>
										</tr>
									);
								})}
							</tbody>
						</table>
					</TableWrapper>
				</Card>

				<Card>
					<CardTitle><span>Compilation result</span></CardTitle>
					<pre>
						{JSON.stringify(JSON.parse(this.state.serializedCompilationResult), null, 2)}
					</pre>
				</Card>
			</preact.Fragment>
		);
	}

}
