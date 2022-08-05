import { request as secureRequest } from "https";
import { request as insecureRequest } from "http";

const hasUrlTlsLayer = (url: string): boolean => url.startsWith("https://");

/** Checks if Storybook is running. */
export default async (targetUrl: string): Promise<boolean> => {
	const request = hasUrlTlsLayer(targetUrl) ? secureRequest : insecureRequest;

	return new Promise<boolean>(
		(resolve) =>
			request(targetUrl, { method: "HEAD" })
				.on("response", () => resolve(true))
				.on("error", () => resolve(false))
				.end(),
	);
};
