import { SocketConstants, UpdateInfo } from "../../omnitrack/core/research/socket"

export default class SocketModule {

  /**
   * key: uid
   * value: client id
   */
  private researcherIdTable = new Map<string, [string]>()

  /**
   * key: experiment id
   * value: client id
   */
  private experimentIdTable = new Map<string, [string]>()

  private serverGlobalEventTable = new Set<string>()
  
  constructor(readonly io: SocketIO.Server){

  }

  private removeKeysWithValue(table: Map<string, [string]>, value: string){
    const keys = []
    table.forEach((val, key, map) => {
      let i
      do{
         i = val.indexOf(value)
         val.splice(i, 1)
      }while(i != -1)

      if(val.length == 0)
      {
        keys.push(key)
      }
    })

    keys.forEach(key =>table.delete(key))
  }
  private putValueToKey(table: Map<string, [string]>, key: string, value: string)
  {
    if(table.has(key))
    {
      table.get(key).push(value)
    }
    else{
      table.set(key, [value])
    }
  }

  bootstrap(){
    console.log("listening to socket.io event.")
    this.io.emit(SocketConstants.SERVER_EVENT_RESET)
    this.io.on("connection", (client) => {
      console.log("Websocket client " + client.id + " connected.")

      client.on("disconnect", () => {
        console.log("websocket client " + client.id + " disconnected." )
        this.removeKeysWithValue(this.experimentIdTable, client.id)
        this.removeKeysWithValue(this.researcherIdTable, client.id)
        
      })

      client.on(SocketConstants.SERVER_EVENT_SUBSCRIBE_SERVER_GLOBAL,
        (data)=>{
          this.serverGlobalEventTable.add(client.id)
        }
      )

      client.on(SocketConstants.SERVER_EVENT_UNSUBSCRIBE_SERVER_GLOBAL,
        (data)=>{
          this.serverGlobalEventTable.delete(client.id)
        }
      )

      client.on(SocketConstants.SERVER_EVENT_SUBSCRIBE_RESEARCHER, (data)=>{
        console.log("a researcher subscribed via websocket.")
        if(data.uid)
        {
          this.putValueToKey(this.researcherIdTable, data.uid, client.id)
        }
      })

      client.on(SocketConstants.SERVER_EVENT_UNSUBSCRIBE_RESEARCHER, (data) => {
        console.log("a researcher unsubscribed.")
        if(data.uid)
        {
          this.researcherIdTable.delete(data.uid)
        }
      })

      client.on(SocketConstants.SERVER_EVENT_SUBSCRIBE_EXPERIMENT, (data)=>{
        console.log("experiment subscribed via websocket.")
        if(data.experimentId)
        {
          this.putValueToKey(this.experimentIdTable, data.experimentId, client.id)
        }
      })

      client.on(SocketConstants.SERVER_EVENT_UNSUBSCRIBE_EXPERIMENT, (data)=>{
        console.log("experiment unsubscribed from websocket.")
        if(data.experimentId)
        {
          this.experimentIdTable.delete(data.experimentId)
        }
      })
      
    })
  }

  public sendDateToEntitySubscribers(entityId: string, entityTable: Map<string, [string]>, eventName: string, data: any): number{
    if(entityTable.has(entityId))
    {
      let count = 0
      entityTable.get(entityId).forEach(
        clientId => {
          const client = this.io.sockets.connected[clientId]
          if(client)
          {
            client.emit(eventName, data)
            count ++
          }
        }
      )
      return count
    }
    return 0
  }

  public sendDataToGlobalSubscribers(eventName: string, data: any): number{
    let count = 0
    this.serverGlobalEventTable.forEach(clientId => {
      const client = this.io.sockets.connected[clientId]
          if(client)
          {
            client.emit(eventName, data)
            count ++
          }
    })
    return count
  }

  public sendGlobalEvent(updateInfo: UpdateInfo | UpdateInfo[]): number{
    return this.sendDataToGlobalSubscribers(SocketConstants.SERVER_EVENT_UPDATED_GLOBAL, updateInfo instanceof Array? updateInfo : [updateInfo])
  }

  public sendDataToExperimentSubscribers(experimentId: string, eventName: string, data: any):number{
    return this.sendDateToEntitySubscribers(experimentId, this.experimentIdTable, eventName, data)  
  }

  public sendDataToResearcherSubscribers(researcherId: string, eventName: string, data: any):number{
    return this.sendDateToEntitySubscribers(researcherId, this.researcherIdTable, eventName, data)
  }

  public sendUpdateNotificationToExperimentSubscribers(experimentId: string, updateInfo: UpdateInfo | UpdateInfo[]){
    this.sendDataToExperimentSubscribers(experimentId, SocketConstants.SOCKET_MESSAGE_UPDATED_EXPERIMENT, updateInfo instanceof Array? updateInfo : [updateInfo])
  }

  public sendUpdateNotificationToResearcherSubscribers(researcherId: string, updateInfo: UpdateInfo | UpdateInfo[]){
    this.sendDataToResearcherSubscribers(researcherId, SocketConstants.SOCKET_MESSAGE_UPDATED_RESEARCHER, updateInfo instanceof Array? updateInfo : [updateInfo])
  }
}