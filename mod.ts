import { dtils } from './deps.ts'
import { downloadBrave } from './download.ts'
import { inferBinaryPath } from './path.ts'

export * from './download.ts'
export * from './path.ts'

export async function getInstalledBinaryPath(directory: string) {
	const path = inferBinaryPath(directory)

	if (!await dtils.exists(path)) await downloadBrave(directory)
	if (!await dtils.exists(path)) throw new Error(`Could not find the brave that was just downloaded at: ${directory}`)

	return path
}
