package compose

import (
	"dagger.io/dagger"

	"universe.dagger.io/docker"
)

_#sourceType: "file" | "directory"

#Container: {
	type: _#sourceType

	{
		type: "file"
		file: string


	} | {
		type:   "directory"
		source: dagger.#FS
	}

	docker.#Run & {

	}
}
