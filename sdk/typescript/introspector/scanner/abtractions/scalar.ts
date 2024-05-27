import ts from "typescript"

export class Scalar {
  private declaration: ts.TypeAliasDeclaration

  private checker: ts.TypeChecker

  private symbol: ts.Symbol

  /**
   * Create a new Scalar instance
   * 
   * @param checker Checker to use to introspect the type of the scalar.
   * @param symbol The symbol of the argument to introspect.
   */
  constructor(checker: ts.TypeChecker, typeDeclaration: ts.TypeAliasDeclaration) {
    this.declaration = typeDeclaration
    this.checker = checker

    const symbol = checker.getSymbolAtLocation(typeDeclaration.name)
    if (!symbol) {
      throw new Error(
        `could not get symbol for scalar ${typeDeclaration.name.getText()}`,
      )
    }

    this.symbol = symbol
  }

  get name(): string {
    return this.symbol.getName()
  }

  get description(): string {
    return ts.displayPartsToString(
      this.symbol.getDocumentationComment(this.checker),
    )
  }

  toJSON() {
    return {
      name: this.name,
      description: this.description,
    }
  }
}