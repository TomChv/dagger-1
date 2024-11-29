import ts from "typescript"

import { TypeDefKind } from "../../../api/client.gen.js"
import { IntrospectionError } from "../../../common/errors/index.js"
import { TypeDef } from "../typedef.js"
import {
  AST,
  isTypeDefResolved,
  resolveTypeDef,
} from "../typescript_module/index.js"
import { DaggerArgument, DaggerArguments } from "./argument.js"
import { References } from "./reference.js"

export type DaggerInterfaceFunctions = {
  [name: string]: DaggerInterfaceFunction
}

export class DaggerInterfaceFunction {
  public name: string
  public description: string

  private _returnTypeRef?: string
  public returnType?: TypeDef<TypeDefKind>
  public arguments: DaggerArguments = {}

  // Just a placeholder to be compatible with `Method` during registration
  public alias: undefined

  private symbol: ts.Symbol
  private signature?: ts.Signature

  constructor(
    private readonly node: ts.PropertySignature,
    private readonly ast: AST,
  ) {
    if (!this.node.name) {
      throw new IntrospectionError(
        `could not resolve name of interface function at ${AST.getNodePosition(node)}`,
      )
    }
    this.symbol = this.ast.getSymbolOrThrow(this.node.name)
    this.name = this.node.name.getText()
    this.description = this.ast.getDocFromSymbol(this.symbol)

    if (this.node.type && ts.isFunctionTypeNode(this.node.type)) {
      const signature = this.ast.getSignatureFromFunctionOrThrow(this.node.type)

      for (const parameter of this.node.type.parameters) {
        this.arguments[parameter.name.getText()] = new DaggerArgument(
          parameter,
          this.ast,
        )
      }

      const signatureReturnType = signature.getReturnType()
      const typedef = this.ast.tsTypeToTypeDef(this.node, signatureReturnType)
      if (typedef === undefined || !isTypeDefResolved(typedef)) {
        this._returnTypeRef = this.ast.typeToStringType(signatureReturnType)
      }

      this.returnType = typedef
    }
  }

  public getReferences(): string[] {
    const references: string[] = []

    if (
      this._returnTypeRef &&
      (this.returnType === undefined || !isTypeDefResolved(this.returnType))
    ) {
      references.push(this._returnTypeRef)
    }

    for (const argument of Object.values(this.arguments)) {
      const reference = argument.getReference()
      if (reference) {
        references.push(reference)
      }
    }

    return references
  }

  public propagateReferences(references: References) {
    for (const argument of Object.values(this.arguments)) {
      argument.propagateReferences(references)
    }

    if (!this._returnTypeRef) {
      return
    }

    if (this.returnType && isTypeDefResolved(this.returnType)) {
      return
    }

    const typeDef = references[this._returnTypeRef]
    if (!typeDef) {
      throw new IntrospectionError(
        `could not find type reference for ${this._returnTypeRef} at ${AST.getNodePosition(this.node)}.`,
      )
    }

    this.returnType = resolveTypeDef(this.returnType, typeDef)
  }

  public toJSON() {
    return {
      name: this.name,
      description: this.description,
      arguments: this.arguments,
      returnType: this.returnType,
    }
  }
}
