export class ResearcherPrevilages {
  static readonly NORMAL = 0
  static readonly ADMIN = 1
  static readonly SUPERUSER = 2
}

export interface IResearcherToken {
  uid: string,
  email: string,
  alias: string,
  previlage: number,
  exp: number,
  iat: number,
  approved: boolean,
}