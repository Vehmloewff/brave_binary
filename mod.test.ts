import { asserts, dtils, http, porter } from './deps.ts'
import { getInstalledBinaryPath } from './mod.ts'

const template = `
<!DOCTYPE html>
<html lang="en">
	<head>
		<meta charset="UTF-8" />
		<meta http-equiv="X-UA-Compatible" content="IE=edge" />
		<meta name="viewport" content="width=device-width, initial-scale=1.0" />
		<title>Document</title>

		<script>
			fetch('/activated')
		</script>
	</head>
	<body>Hello</body>
</html>
`

Deno.test('getInstalledBinaryPath gets a working brave', async () => {
	const controller = new AbortController()

	const port = await porter.getAvailablePort()
	if (!port) throw new Error('Could not find an available port')

	const serverPromise = http.serve((request) => {
		const url = new URL(request.url)

		if (url.pathname == '/') return new Response(template, { headers: { 'Content-Type': 'text/html' } })
		if (url.pathname === '/activated') controller.abort()

		return new Response('not found')
	}, { port, signal: controller.signal, onListen() {} })

	const pipeDisposition = dtils.getLogLevel() === 'verbose' ? 'inherit' : 'null'
	const brave = new Deno.Command(
		await getInstalledBinaryPath('test_data/chrome'),
		{
			signal: controller.signal,
			args: [
				'--headless=new',
				'--window-size=1000,1500',
				'--user-data-dir=./test_data/data',
				'--incognito',
				`http://localhost:${port}`,
			],
			stdout: pipeDisposition,
			stderr: pipeDisposition,
			stdin: 'null',
		},
	).spawn()

	const timeoutSeconds = 20
	let timeout

	const timeoutPromise = new Promise((resolve) => timeout = setTimeout(resolve, timeoutSeconds * 1000))

	const completedInTime = await Promise.race([serverPromise.then(() => true), timeoutPromise.then(() => false)])
	clearTimeout(timeout)

	if (!completedInTime) {
		controller.abort()
		asserts.fail(`Didn\'t receive an activation from Brave in ${timeoutSeconds}s`)
	}

	await brave.status
})
