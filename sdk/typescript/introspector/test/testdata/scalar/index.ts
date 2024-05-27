import { Platform } from "../../../../api/client.gen.js"
import { func, object } from "../../../decorators/decorators.js"

/**
 * A custom scalar
 */
type Custom = "foo" | "bar"

@object()
export class Scalar {
  @func()
  fromPlatform(platform: Platform): string {
    return platform as string
  }

  @func()
  fromPlatforms(platforms: Platform[]): string[] {
    return platforms.map((p) => p as string)
  }

	@func()
	fromCustom(custom: Custom): string {
		return custom
	}

	@func()
	fromCustoms(customs: Custom[]): string[] {
		return customs
	}

	@func()
	custom(): Custom {
		return "foo"
	}
}
