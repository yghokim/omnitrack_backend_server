export function makeArrayLikeQueryCondition(queryValue: string | Array<String>): any {
  if (queryValue instanceof Array) {
    return { "$in": queryValue }
  } else { return queryValue }
}