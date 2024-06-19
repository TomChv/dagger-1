import ts from "typescript"

import { UnknownDaggerError } from "../../../common/errors/UnknownDaggerError.js"

export type DaggerEnumValues = { [name: string]: DaggerEnumValue }

export class DaggerEnumValue {
  private checker: ts.TypeChecker

  private property: ts.PropertyDeclaration

  private symbol: ts.Symbol

  private _name: string

  private _description: string

  constructor(checker: ts.TypeChecker, property: ts.PropertyDeclaration) {
    this.checker = checker
    this.property = property

    const propertySymbol = checker.getSymbolAtLocation(property.name)
    if (!propertySymbol) {
      throw new UnknownDaggerError(
        `could not get property symbol: ${property.name.getText()}`,
        {},
      )
    }

    this.symbol = propertySymbol
    this._name = this.loadName()
    this._description = this.loadDescription()
  }

  get name(): string {
    return this._name
  }

  get description(): string {
    return this._description
  }

  toJSON() {
    return {
      name: this.name,
      description: this.description,
    }
  }

  // LoadName load the value of the enum value from the property initializer.
  // If the initializer is not set, it will throw an error.
  // We do not use the actual property name because it may varies between SDKs languages conventions.
  private loadName(): string {
    if (!this.property.initializer) {
      throw new Error("Dagger enum value has no value set")
    }

    return JSON.parse(this.property.initializer.getText())
  }

  private loadDescription(): string {
    return ts.displayPartsToString(
      this.symbol.getDocumentationComment(this.checker),
    )
  }
}
