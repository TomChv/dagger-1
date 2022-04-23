package compose

import (
	"universe.dagger.io/docker"
	"universe.dagger.io/docker/cli"
)

_#defaultVersion: "v2.4.0"

// Docker compose image
#Image: {
	// Docker compose version
	version: *_#defaultVersion | string

	// Additional package to install
	packages: [pkgName=string]: version: string | *""

	docker.#Build & {
		steps: [
			cli.#Image,
			docker.#Run & {
				command: {
					name: "/bin/sh"
					args: ["-c", """
							mkdir -p ~/.docker/cli-plugins

							ARCH=linux-$(uname -m)
							BINARY=docker-compose
							wget -q https://github.com/docker/compose/releases/download/${COMPOSE_VERSION}/${BINARY}-${ARCH} -O ~/.docker/cli-plugins/${BINARY}
							chmod +x ~/.docker/cli-plugins/$BINARY
						"""]
				}
				env: COMPOSE_VERSION: version
			},
			for pkgName, pkg in packages {
				docker.#Run & {
					command: {
						name: "apk"
						args: ["add", "\(pkgName)\(pkg.version)"]
						flags: {
							"-U":         true
							"--no-cache": true
						}
					}
				}
			},
		]
	}

}
