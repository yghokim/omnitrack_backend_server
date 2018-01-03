import IdGenerator from "./id_generator";
import * as fs from "fs-extra";

/**
 * Contains the anonymised tracker and trigger package that are portable and injectable to any users.
 */
export default class PredefinedPackage {
  static readonly PLACEHOLDER_PREFIX = "%{"
  static readonly PLACEHOLDER_SUFFIX = "}%"

  trackers: Array<any> = []
  triggers: Array<any> = []
  serviceCodes: Array<string> = []

  placeHolderDict: {
    user: string,
    trackers: Array<string>,
    triggers: Array<string>,
    attributes: Array<{ id: string, localId: string }>
  } = { user: null, trackers: [], triggers: [], attributes: [] }

  /**
   *
   * @param trackers trackers in a client format
   * @param triggers triggers in a client format
   */
  constructor(trackers: Array<any>, triggers: Array<any>) {
    this.trackers = trackers
    this.triggers = triggers
    this.refresh()
  }

  /**
   * Writes the package into Json file.
   * @param path JSON file path to write
   */
  write(path: string): Promise<void> {
    return fs.outputJson(path, {
      trackers: this.trackers,
      triggers: this.triggers,
      serviceCodes: this.serviceCodes
    }, { spaces: 2 })
  }

  /**
   * Anonymise current data again.
   */
  refresh() {
    // first, clear removed ones
    for (let i = this.trackers.length - 1; i >= 0; --i) {
      if (this.trackers[i].removed === true) {
        this.trackers.splice(i, 1)
      } else {
        for (let j = this.trackers[i].attributes.length - 1; j >= 0; --j) {
          const attr = this.trackers[i].attributes[j]
          if (attr.isInTrashcan === true) {
            this.trackers[i].attributes.splice(j, 1)
          }
        }
      }
    }

    for (let i = this.triggers.length - 1; i >= 0; --i) {
      if (this.triggers[i].removed === true) {
        this.triggers.splice(i, 1)
      }
    }

    const trackerIdTable = {}
    let trackerCount = 0
    const triggerIdTable = {}
    let triggerCount = 0
    const attributeIdTable = {}
    let attributeCount = 0
    const attributeLocalIdTable = {}

    this.placeHolderDict = { user: null, trackers: [], triggers: [], attributes: [] }
    this.placeHolderDict.user = this.generatePlaceholder("owner")

    // anonymise trackers and attributes
    this.trackers.forEach(tracker => {
      tracker.user = this.placeHolderDict.user
      const trackerPlaceHolder = this.generatePlaceholder("tracker", trackerCount)
      trackerCount++

      this.placeHolderDict.trackers.push(trackerPlaceHolder)
      trackerIdTable[tracker.objectId] = trackerPlaceHolder
      tracker.objectId = trackerPlaceHolder
      tracker.attributes.forEach(attribute => {
        const attrPlaceHolder = this.generatePlaceholder("attribute", attributeCount)
        const attrLocalIdPlaceHolder = this.generatePlaceholder("attribute_local", attributeCount)
        this.placeHolderDict.attributes.push({ id: attrPlaceHolder, localId: attrLocalIdPlaceHolder })
        attributeIdTable[attribute.objectId] = attrPlaceHolder
        attributeLocalIdTable[attribute.localId] = attrLocalIdPlaceHolder
        attributeCount++

        attribute.objectId = attrPlaceHolder
        attribute.localId = attrLocalIdPlaceHolder
        attribute.trackerId = trackerIdTable[attribute.trackerId]
      })
    })

    // anonymise triggers and associated trackers and attributes
    this.triggers.forEach(trigger => {
      const triggerPlaceHolder = this.generatePlaceholder("trigger", triggerCount)
      triggerCount++
      this.placeHolderDict.triggers.push(triggerPlaceHolder)
      triggerIdTable[trigger.objectId] = triggerPlaceHolder
      trigger.objectId = triggerPlaceHolder

      trigger.user = this.placeHolderDict.user
      if (trigger.trackers != null) {
        for (let i = 0; i < trigger.trackers.length; i++) {
          trigger.trackers[i] = trackerIdTable[trigger.trackers[i]]
        }
      }

      // condition script
      if (trigger.script != null) {
        for (const id in trackerIdTable) {
          if (trackerIdTable.hasOwnProperty(id)) {
            trigger.script = trigger.script.replace(id, trackerIdTable[id])
          }
        }
        for (const id in triggerIdTable) {
          if (triggerIdTable.hasOwnProperty(id)) {
            trigger.script = trigger.script.replace(id, triggerIdTable[id])
          }
        }
        for (const id in attributeIdTable) {
          if (attributeIdTable.hasOwnProperty(id)) {
            trigger.script = trigger.script.replace(id, attributeIdTable[id])
          }
        }
        for (const id in attributeLocalIdTable) {
          if (attributeLocalIdTable.hasOwnProperty(id)) {
            trigger.script = trigger.script.replace(id, attributeLocalIdTable[id])
          }
        }
      }
    })
  }

  private generatePlaceholder(text: string, index: number = null) {

    return PredefinedPackage.PLACEHOLDER_PREFIX + text.toUpperCase() + "_" + (index || 0) + PredefinedPackage.PLACEHOLDER_SUFFIX
  }

}
