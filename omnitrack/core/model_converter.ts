export class ModelConverter {

  static convertDbToClientFormat(dbEntry: any, options: ConvertOptions = null): any {
    const obj = JSON.parse(JSON.stringify(dbEntry))

    if (options != null) {
      if (options.excludeTimestamps) {
        delete obj.createdAt
        delete obj.updatedAt
        delete obj.userCreatedAt
        delete obj.userUpdatedAt
        delete obj.synchronizedAt

        if (obj.attributes != null) {
          if (obj.attributes.constructor === Array) {
            obj.attributes.forEach(attribute => {
                delete attribute.userCreatedAt
                delete attribute.userUpdatedAt
              }
            )
          }
        }
      } else {
        obj.synchronizedAt = dbEntry.updatedAt.getTime()
      }
    } else {
      obj.synchronizedAt = dbEntry.updatedAt.getTime()
    }

    return obj
  }

  static convertClientToDbFormat(clientEntry: any): any {
    const obj = JSON.parse(JSON.stringify(clientEntry))

    delete obj.synchronizedAt

    return obj
  }
}

export interface ConvertOptions {
  excludeTimestamps: boolean
}
