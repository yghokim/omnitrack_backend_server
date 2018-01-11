import { TimePoint, TimeSpan, ServerFile, LatLng, Fraction } from './datatypes/field_datatypes'
import * as bigdecimal from 'bigdecimal';
import * as StringBuilder from 'stringbuilder';

export default class TypedStringSerializer {
  static readonly TYPENAME_INT = "I"
  static readonly TYPENAME_LONG = "L"
  static readonly TYPENAME_FLOAT = "F"
  static readonly TYPENAME_DOUBLE = "d"
  static readonly TYPENAME_BIGDECIMAL = "D"
  static readonly TYPENAME_TIMEPOINT = "T"
  static readonly TYPENAME_STRING = "S"
  static readonly TYPENAME_INT_ARRAY = "I[]"
  static readonly TYPENAME_LONG_ARRAY = "L[]"
  static readonly TYPENAME_LATITUDE_LONGITUDE = "Crd"
  static readonly TYPENAME_ROUTE = "R"
  static readonly TYPENAME_TIMESPAN = "TS"
  static readonly TYPENAME_FRACTION = "Fr"
  static readonly TYPENAME_SERVERFILE = "SF"

  static deserialize(typedString: string): any {

    const typeLength = parseInt(typedString[0])
    const typeName = typedString.substr(1, typeLength)
    const value = typedString.substring(1 + typeLength, typedString.length).toString()
    switch (typeName) {
        case TypedStringSerializer.TYPENAME_INT: return parseInt(value)
        case TypedStringSerializer.TYPENAME_FLOAT: return parseFloat(value)
        case TypedStringSerializer.TYPENAME_DOUBLE: return parseFloat(value)
        case TypedStringSerializer.TYPENAME_LONG: return parseInt(value)
        case TypedStringSerializer.TYPENAME_STRING: return value
        case TypedStringSerializer.TYPENAME_BIGDECIMAL: return new bigdecimal.BigDecimal(value)

        case TypedStringSerializer.TYPENAME_TIMEPOINT:
          const tpParts = value.split('@')
          return new TimePoint(parseInt(tpParts[0]), tpParts[1])

        case TypedStringSerializer.TYPENAME_TIMESPAN:
          const tsParts = value.split('@')
          return new TimeSpan(parseInt(tsParts[0]), parseInt(tsParts[1]), tsParts[2])

        case TypedStringSerializer.TYPENAME_INT_ARRAY:
        case TypedStringSerializer.TYPENAME_LONG_ARRAY:
         if (value.length === 0) {
            return new Array<number>()
        } else {
            return value.split(",").map(s => parseInt(s))
        }

        case TypedStringSerializer.TYPENAME_LATITUDE_LONGITUDE:
          const llParts = value.split(",")
          return new LatLng(parseFloat(llParts[0]), parseFloat(llParts[1]))

        // case TypedStringSerializer.TYPENAME_ROUTE -> Route(value)
        case TypedStringSerializer.TYPENAME_SERVERFILE:
          const serverFileJson = JSON.parse(value)
          return new ServerFile(serverFileJson.path, serverFileJson.size, serverFileJson.mime, serverFileJson.origName)

        case TypedStringSerializer.TYPENAME_FRACTION:
            const frParts = value.split("/")
            return new Fraction(parseInt(frParts[0]), parseInt(frParts[1]))

    }
  }

  static serialize(typeName: string, value: any): string {
    const stringBuilder = new StringBuilder()
    stringBuilder.append(typeName.length)
    stringBuilder.append(typeName)
    switch (typeName) {
        case TypedStringSerializer.TYPENAME_BIGDECIMAL:
          stringBuilder.append(value.toString())
          break;
        case TypedStringSerializer.TYPENAME_TIMEPOINT:
          stringBuilder.append(value.timestamp).append("@").append(value.timezone)
          break;
        case TypedStringSerializer.TYPENAME_TIMESPAN:
          stringBuilder.append(value.from).append("@").append(value.duration).append("@").append(value.timezone)
          break;
        case TypedStringSerializer.TYPENAME_LONG_ARRAY:
        case TypedStringSerializer.TYPENAME_INT_ARRAY:
          stringBuilder.append(value.joinToString(","))
          break;
        case TypedStringSerializer.TYPENAME_LATITUDE_LONGITUDE:
          stringBuilder.append(value.latitude).append(",").append(value.longitude)
          break;
        // case TypedStringSerializer.TYPENAME_ROUTE -> (value as Route).getSerializedString()
        case TypedStringSerializer.TYPENAME_FRACTION:
          stringBuilder.append(value.upper).append("/").append(value.under)
          break;
        case TypedStringSerializer.TYPENAME_SERVERFILE:
          const serverFileJson = {}
          const serverFile = value as ServerFile
          serverFileJson["path"] = serverFile.serverPath
          serverFileJson["size"] = serverFile.fileSize
          serverFileJson["mime"] = serverFile.mimeType
          serverFileJson["origName"] = serverFile.originalFileName
          stringBuilder.append(JSON.stringify(serverFileJson))
          break;
        default:
          stringBuilder.append(value.toString())
          break;
    }

    return stringBuilder.build()
  }
}