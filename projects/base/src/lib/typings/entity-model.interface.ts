import { IEntityField } from "../components/edit-entity/edit-entity.component"
import { IEntity } from "../components/edit-entity/edit-entity.component"

export interface IEntityModel<T = any> {
  entity: IEntity
  fields: IEntityField[]
  records: T[]
}
