export function merge(objA: any, objB: any, overwrite: boolean): any{
  if(!objA)
  {
    return JSON.parse(JSON.stringify(objB))
  }

  const newObj = JSON.parse(JSON.stringify(objA))
  if(!objB)
  {
    return newObj
  }

  for(let bField in objB)
  {
    if(objB.hasOwnProperty(bField))
    {
      if(objA.hasOwnProperty(bField))
      {
        if(overwrite)
        {
          newObj[bField] = objB[bField]
        }
      }
      else{
        newObj[bField] = objB[bField]
      }
    }
  }
  return newObj
}