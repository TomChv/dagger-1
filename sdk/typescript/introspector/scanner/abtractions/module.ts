import ts from "typescript"

import { isObject, toPascalCase } from "../utils.js"
import { DaggerObject, DaggerObjects } from "./object.js"
import { Scalar } from "./scalar.js"

export class DaggerModule {
  private checker: ts.TypeChecker

  private _objects: DaggerObjects = {}

  private _scalars: Scalar[] = []

  public name: string

  constructor(
    checker: ts.TypeChecker,
    name = "",
    dir = "",
    files: readonly ts.SourceFile[],
  ) {
    this.checker = checker
    this.name = toPascalCase(name)

    for (const file of files) {
      if (file.isDeclarationFile || !file.fileName.startsWith(dir)) {
        continue
      }

      ts.forEachChild(file, (node) => {
        // Handle class declaration
        if (ts.isClassDeclaration(node) && isObject(node)) {
          const object = new DaggerObject(this.checker, file, node)

          this._objects[object.name] = object
        }

        // Handle type alias declaration
        if (ts.isTypeAliasDeclaration(node)) {
          const scalar = new Scalar(this.checker, node)

          this._scalars.push(scalar)
        }
      })
    }
  }

  get objects(): DaggerObjects {
    return this._objects
  }

  get description(): string | undefined {
    const mainObject = Object.values(this.objects).find(
      (object) => object.name === this.name,
    )
    if (!mainObject) {
      return undefined
    }

    const file = mainObject.file
    const topLevelStatement = file.statements[0]
    if (!topLevelStatement) {
      return undefined
    }

    // Get the range of the top level comment
    const topLevelCommentRanges = ts.getLeadingCommentRanges(
      file.getFullText(),
      topLevelStatement.pos,
    )
    if (!topLevelCommentRanges || topLevelCommentRanges.length === 0) {
      return undefined
    }

    const topLevelCommentRange = topLevelCommentRanges[0]

    return file
      .getFullText()
      .substring(topLevelCommentRange.pos, topLevelCommentRange.end)
      .split("\n")
      .slice(1, -1) // Remove start and ending comments characters `/** */`
      .map((line) => line.replace("*", "").trim()) // Remove leading * and spaces
      .join("\n")
  }

  get scalars(): Scalar[] {
    return this._scalars
  }

  toJSON() {
    return {
      name: this.name,
      description: this.description,
      objects: Object.entries(this.objects).reduce(
        (acc: { [name: string]: DaggerObject }, [name, object]) => {
          acc[name] = object

          return acc
        },
        {},
      ),
      scalars: this.scalars,
    }
  }
}
