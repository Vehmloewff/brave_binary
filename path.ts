import { pathUtils } from './deps.ts'

export function inferBinaryPath(directory: string) {
	const platform = Deno.build.os

	if (platform === 'darwin') return pathUtils.join(directory, 'Brave Browser.app/Contents/MacOS/Brave Browser')
	if (platform === 'windows') return pathUtils.join(directory, 'brave.exe')
	if (platform === 'linux') return pathUtils.join(directory, 'brave-browser')

	throw new Error(`Unsupported platform: ${platform}`)
}
