
export abstract class AHierarchicalDependencyGraph<KeyType>{
  public dependencyMap: Map<string, Array<KeyType>>
  public defaultFlags: Map<string, boolean>

  public abstract convertKeyTypeToString(keyType: KeyType): string
  public abstract convertStringToKeyType(stringKey: string): KeyType

  constructor(map: Map<string, Array<KeyType>> = null, defaultFlags: Map<string, boolean> = null) {
    if (map) {
      this.dependencyMap = map
    } else {
      this.dependencyMap = new Map<string, Array<KeyType>>()
    }

    if (defaultFlags) {
      this.defaultFlags = defaultFlags
    } else {
      this.defaultFlags = new Map<string, boolean>()
    }
  }

  setDefaultValue(key: KeyType, defaultFlag: boolean) {
    this.defaultFlags.set(this.convertKeyTypeToString(key), defaultFlag)
  }

  addDependency(a: KeyType, dependsOn: KeyType) {
    const stringA = this.convertKeyTypeToString(a)
    const stringDependsOn = this.convertKeyTypeToString(dependsOn)
    if (this.dependencyMap.has(stringA)) {
      if (this.dependencyMap.get(stringA).find(d => this.convertKeyTypeToString(d) === stringDependsOn) == null)
        this.dependencyMap.get(stringA).push(dependsOn)
    } else {
      this.dependencyMap.set(stringA, [])
    }
  }


  public abstract getRawFlag(key: KeyType): boolean

  public getRawFlagFallback(key: KeyType): boolean {
    const rawFlag = this.getRawFlag(key)
    if (rawFlag != null) {
      return rawFlag
    } else return this.defaultFlags.get(this.convertKeyTypeToString(key))
  }

  public getCascadedFlag(keyType: KeyType): boolean {
    const key = this.convertKeyTypeToString(keyType)
    if (this.dependencyMap.has(key) === true) {
      const dependencyKeys = this.dependencyMap.get(key)
      if (dependencyKeys.length == 0) return this.getRawFlagFallback(keyType)
      else {
        let falseKeyFound = false
        for (const dependencyKey of dependencyKeys) {
          if (this.getCascadedFlag(dependencyKey) === false) {
            falseKeyFound = true
            break;
          }
        }
        if (falseKeyFound == true) {
          return false
        } else {
          return this.getRawFlagFallback(keyType)
        }
      }
    } else return this.getRawFlagFallback(keyType)
  }
}