export interface UpdateInfo{
  model: string,
  event: string,
  payload?: any
}

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
    this.io.emit("server/reset")
    this.io.on("connection", (client) => {
      console.log("Websocket client " + client.id + " connected.")

      client.on("disconnect", () => {
        console.log("websocket client " + client.id + " disconnected." )
        this.removeKeysWithValue(this.experimentIdTable, client.id)
        this.removeKeysWithValue(this.researcherIdTable, client.id)
        
      })

      client.on("subscribe_researcher", (data)=>{
        console.log("a researcher subscribed via websocket.")
        if(data.uid)
        {
          this.putValueToKey(this.researcherIdTable, data.uid, client.id)
        }
      })

      client.on("unsubscribe_researcher", (data) => {
        console.log("a researcher unsubscribed.")
        if(data.uid)
        {
          this.researcherIdTable.delete(data.uid)
        }
      })

      client.on("subscribe_experiment", (data)=>{
        console.log("experiment subscribed via websocket.")
        if(data.experimentId)
        {
          this.putValueToKey(this.experimentIdTable, data.experimentId, client.id)
        }
      })

      client.on("unsubscribe_experiment", (data)=>{
        console.log("experiment unsubscribed from websocket.")
        if(data.experimentId)
        {
          this.experimentIdTable.delete(data.experimentId)
        }
      })
      
    })
  }

  public sendDataToExperimentSubscribers(experimentId: string, eventName: string, data: any){
    console.log("find websocket clients with experiment id.")
    if(this.experimentIdTable.has(experimentId))
    {
      console.log("found websocket clients with expeirment id : " + this.experimentIdTable.get(experimentId).length)
    
      this.experimentIdTable.get(experimentId).forEach(
        clientId => {
          console.log("emit experiment update message " + eventName + " to client " + clientId)

          const client = this.io.sockets.connected[clientId]
          
          if(client)
          {
            client.emit(eventName, data)
          }
        }
      )
    }
    else{
      console.log("No websocket clients are connected to the experiment. skip the message.")
    }
  }

  public sendUpdateNotificationToExperimentSubscribers(experimentId: string, updateInfo: UpdateInfo){
    this.sendDataToExperimentSubscribers(experimentId, "updated/experiment", updateInfo)
  }

  public sendUpdateNotificationToResearcherSubscribers(researcherId: string, updateInfo: UpdateInfo){
    this.sendDataToExperimentSubscribers(researcherId, "updated/researcher", updateInfo)
  }
}