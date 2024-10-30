/* eslint-disable @typescript-eslint/no-explicit-any */
import ts from "typescript"

import { TypeDefKind } from "../../../api/client.gen.js"
import { IntrospectionError } from "../../../common/errors/IntrospectionError.js"
import { ArgumentOptions } from "../../registry/registry.js"
import { TypeDef } from "../typedef.js"
import { AST } from "../typescript_module/ast.js"
import {
  isTypeDefResolved,
  resolveTypeDef,
} from "../typescript_module/typedef_utils.js"
import { ARGUMENT_DECORATOR } from "./decorator.js"
import { References } from "./reference.js"

export type DaggerArguments = { [name: string]: DaggerArgument }

export class DaggerArgument {
  public name: string
  public description: string
  private _typeRef?: string
  public type?: TypeDef<TypeDefKind>
  public isVariadic: boolean
  public isNullable: boolean
  public isOptional: boolean
  public defaultPath?: string
  public ignore?: string[]
  public defaultValue?: any

  private symbol: ts.Symbol

  constructor(
    private readonly node: ts.ParameterDeclaration,
    private readonly ast: AST,
  ) {
    this.symbol = this.ast.getSymbolOrThrow(node.name)
    this.name = this.node.name.getText()
    this.description = this.ast.getDocFromSymbol(this.symbol)
    this.defaultValue = this.getDefaultValue()
    this.isVariadic = this.node.dotDotDotToken !== undefined
    this.isNullable = this.getIsNullable()
    this.isOptional =
      this.isVariadic ||
      this.defaultValue !== undefined ||
      this.isNullable ||
      this.node.questionToken !== undefined

    const decoratorArguments = this.ast.getDecoratorArgument<ArgumentOptions>(
      this.node,
      ARGUMENT_DECORATOR,
      "object",
    )

    if (decoratorArguments) {
      this.ignore = decoratorArguments.ignore
      this.defaultPath = decoratorArguments.defaultPath
    }

    this.type = this.getType()
  }

  /**
   * Get the type of the parameter.
   *
   * If for it's a complex type that cannot be
   * resolve yet, we save its string representation for further reference.
   */
  private getType(): TypeDef<TypeDefKind> | undefined {
    const type = this.ast.checker.getTypeAtLocation(this.node)

    const typedef = this.ast.tsTypeToTypeDef(this.node, type)
    if (typedef === undefined || !isTypeDefResolved(typedef)) {
      this._typeRef = this.ast.typeToStringType(type)
    }

    return typedef
  }

  private getIsNullable(): boolean {
    if (!this.node.type) {
      return false
    }

    if (ts.isUnionTypeNode(this.node.type)) {
      for (const _type of this.node.type.types) {
        if (_type.getText() === "null") {
          return true
        }
      }
    }

    return false
  }

  private getDefaultValue(): any {
    const initializer = this.node.initializer
    if (!initializer) {
      return undefined
    }

    return this.ast.resolveParameterDefaultValue(initializer)
  }

  public getReference(): string | undefined {
    if (
      this._typeRef &&
      (this.type === undefined || !isTypeDefResolved(this.type))
    ) {
      return this._typeRef
    }

    return undefined
  }

  public propagateReferences(references: References) {
    if (!this._typeRef) {
      return
    }

    if (this.type && isTypeDefResolved(this.type)) {
      return
    }

    const typeDef = references[this._typeRef]
    if (!typeDef) {
      throw new IntrospectionError(
        `could not find type reference for ${this._typeRef} at ${AST.getNodePosition(this.node)}.`,
      )
    }

    this.type = resolveTypeDef(this.type, typeDef)
  }

  toJSON() {
    return {
      name: this.name,
      description: this.description,
      type: this.type,
      isVariadic: this.isVariadic,
      isNullable: this.isNullable,
      isOptional: this.isOptional,
      defaultValue: this.defaultValue,
      defaultPath: this.defaultPath,
      ignore: this.ignore,
    }
  }
}
