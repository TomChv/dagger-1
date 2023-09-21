import sys

import anyio

import dagger

from .pipelines import Pipelines


# initialize Dagger client
# pass client to method imported from another module
async def main():
    async with dagger.Connection(dagger.Config(log_output=sys.stderr)) as client:
        pipeline = Pipelines(client)

        print(await pipeline.version())


if __name__ == "__main__":
    anyio.run(main)
