import FieldHelper from "./field.helper";
import { RatingFieldHelper } from "./rating.field.helper";
import { NumberFieldHelper } from "./number.field.helper";
import fieldTypes from "./field-types";
import { ChoiceFieldHelper } from './choice.field.helper';
import { TimeSpanFieldHelper } from "./time-span.field.helper";
import { TimePointFieldHelper } from "./time-point.field.helper";
import { LocationFieldHelper } from './location.field.helper';
import { ShortTextFieldHelper } from "./shortext.field.helper";
import { LongTextFieldHelper } from "./longtext.field.helper";
import { AudioRecordFieldHelper } from "./audiorecord.field.helper";
import { ImageFieldHelper } from "./image.field.helper";

export default class FieldManager {

  private static readonly dict = {}

  static getTypeInfos(): Array<{ id: number, name: string }> {
    return [
      {
        id: fieldTypes.ATTR_TYPE_SHORT_TEXT,
        name: "Short Text"
      },{
        id: fieldTypes.ATTR_TYPE_LONG_TEXT,
        name: "Long Text"
      },{
        id: fieldTypes.ATTR_TYPE_RATING,
        name: "Rating"
      },{
        id: fieldTypes.ATTR_TYPE_NUMBER,
        name: "Number"
      },{
        id: fieldTypes.ATTR_TYPE_CHOICE,
        name: "Choice"
      },{
        id: fieldTypes.ATTR_TYPE_TIMESPAN,
        name: "Time Span"
      },{
        id: fieldTypes.ATTR_TYPE_TIME,
        name: "Time Point"
      },{
        id: fieldTypes.ATTR_TYPE_LOCATION,
        name: "Short Text"
      },{
        id: fieldTypes.ATTR_TYPE_AUDIO,
        name: "Audio"
      },{
        id: fieldTypes.ATTR_TYPE_IMAGE,
        name: "Image"
      },
    ]
  }

  static getHelper(type: number): FieldHelper {
    const helper = FieldManager.dict[type.toString()]
    if (helper instanceof FieldHelper) {
      return helper
    } else {
      switch (type) {
        case fieldTypes.ATTR_TYPE_SHORT_TEXT:
          FieldManager.dict[type.toString()] = new ShortTextFieldHelper()
          break;
        case fieldTypes.ATTR_TYPE_LONG_TEXT:
          FieldManager.dict[type.toString()] = new LongTextFieldHelper()
          break;
        case fieldTypes.ATTR_TYPE_RATING:
          FieldManager.dict[type.toString()] = new RatingFieldHelper()
          break;
        case fieldTypes.ATTR_TYPE_NUMBER:
          FieldManager.dict[type.toString()] = new NumberFieldHelper()
          break;
        case fieldTypes.ATTR_TYPE_CHOICE:
          FieldManager.dict[type.toString()] = new ChoiceFieldHelper()
          break;
        case fieldTypes.ATTR_TYPE_TIMESPAN:
          FieldManager.dict[type.toString()] = new TimeSpanFieldHelper()
          break;
        case fieldTypes.ATTR_TYPE_TIME:
          FieldManager.dict[type.toString()] = new TimePointFieldHelper()
          break;
        case fieldTypes.ATTR_TYPE_LOCATION:
          FieldManager.dict[type.toString()] = new LocationFieldHelper()
          break;
        case fieldTypes.ATTR_TYPE_AUDIO:
          FieldManager.dict[type.toString()] = new AudioRecordFieldHelper()
          break;
        case fieldTypes.ATTR_TYPE_IMAGE:
          FieldManager.dict[type.toString()] = new ImageFieldHelper()
          break;

      }

      const helper = FieldManager.dict[type.toString()]
      return helper
    }
  }
}