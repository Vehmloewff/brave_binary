import { dtils, zip } from './deps.ts'

const LATEST_ENDPOINT = 'https://api.github.com/repos/brave/brave-browser/releases/latest'

export type Platform = 'darwin' | 'windows' | 'linux'
export type Architecture = 'x86_64' | 'aarch64'

interface GithubAsset {
	url: string
	name: string
}

async function getLatestReleaseAssets(): Promise<GithubAsset[]> {
	const latestRelease = await fetch(LATEST_ENDPOINT, {
		headers: { 'accept': 'application/vnd.github+json' },
	}).then((res) => res.json())

	// Just waiting on Dtils to release their safe JSON tools
	// deno-lint-ignore no-explicit-any
	return latestRelease.assets.map((asset: any) => ({ url: asset.url, name: asset.name }))
}

function getOsFriendlyZipUrl(assets: GithubAsset[], platform: Platform, arch: Architecture) {
	const braveFriendlyArches = arch === 'aarch64' ? ['arm64'] : ['x64', 'amd64']

	for (const asset of assets) {
		if (!asset.name.endsWith('.zip')) continue
		if (!asset.name.includes(platform)) continue
		if (asset.name.includes('symbols')) continue

		for (const braveFriendlyArch of braveFriendlyArches) {
			if (!asset.name.includes(braveFriendlyArch)) continue

			console.log(asset.name)
			return asset.url
		}
	}

	throw new Error(`Could not find a .zip asset for ${platform} ${arch}. Scanned names: ${assets.map(({ name }) => name)}`)
}

function getUsedPlatform(): Platform {
	const platform = Deno.build.os
	if (platform !== 'darwin' && platform !== 'windows' && platform !== 'linux') throw new Error(`Unsupported platform: ${platform}`)

	return platform
}

export interface DownloadBraveOptions {
	platform?: Platform
	arch?: Architecture
}

export async function downloadBrave(directory: string, options: DownloadBraveOptions = {}): Promise<void> {
	const platform = options.platform || getUsedPlatform()
	const arch = options.arch || Deno.build.arch

	const assets = await getLatestReleaseAssets()
	const assetUrl = getOsFriendlyZipUrl(assets, platform, arch)

	const response = await fetch(assetUrl, {
		headers: { accept: 'application/octet-stream' },
	})

	if (!response.ok) throw new Error(`Bad response from github api (${response.status}): ${await response.text()}`)
	if (!response.body) throw new Error('Expected response to have a body')

	const tempFileName = await Deno.makeTempFile()
	await Deno.writeFile(tempFileName, response.body)

	if (!await dtils.exists(directory)) await Deno.mkdir(directory, { recursive: true })

	await zip.decompress(tempFileName, directory)
}
