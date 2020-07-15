import env from '../../env';
import { ResearcherPrevilages } from '../../../omnitrack/core/research/researcher';
import OTResearcher from "../../models/ot_researcher";
import { OTAuthCtrlBase, JwtTokenSchemaBase } from "../ot_auth_controller";

export class OTResearchAuthCtrl extends OTAuthCtrlBase {

  constructor() {
    super(OTResearcher, 'researcher', 'email', ["alias"])
  }

  protected modifyJWTSchema(user: any, tokenSchema: JwtTokenSchemaBase): void {
    const schema = tokenSchema as any
    schema.alias = user.alias
    schema.approved = user.account_approved
    schema.previlage = (env.super_users as Array<string> || []).indexOf(user.email) !== -1 ? ResearcherPrevilages.SUPERUSER : ResearcherPrevilages.NORMAL
  }

  protected modifyNewAccountSchema(schema: any, request: any) {
    schema.alias = request.body.alias,
      schema.account_approved = env.super_users.indexOf(schema.email) !== -1 ? true : null
  }
}
