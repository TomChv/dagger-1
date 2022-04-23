package docker_compose

import (
	"dagger.io/dagger"

	"universe.dagger.io/docker"
	"universe.dagger.io/x/tom.chauveau.pro@icloud.com/docker/compose"
)

dagger.#Plan & {
	actions: test: image: {
		simple: {
			image: compose.#Image

			verify: docker.#Run & {
				input: image.output
				command: {
					name: "/bin/sh",
					args: ["-c", """
						docker compose version
					"""]
				}
			}
		}

		custom: {

		}
	}
}