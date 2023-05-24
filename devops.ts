import { dtils } from './deps.ts'

export async function test() {
	const args = ['deno', 'test', '-A', '.']
	if (dtils.getEnv() === 'dev') args.push('--watch')

	await dtils.exec(args)
}

export async function ci() {
	await test()
}
