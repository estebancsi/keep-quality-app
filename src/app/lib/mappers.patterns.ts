export abstract class MapperPatterns<Entity, DTO> {
  abstract toDomain(entity: Entity): DTO;
  abstract toPersistence(dto: Partial<DTO>): Partial<Entity>;

  toDomainList(entities: Entity[]): DTO[] {
    return entities.map((entity) => this.toDomain(entity));
  }

  toPersistenceList(dtos: Partial<DTO>[]): Partial<Entity>[] {
    return dtos.map((dto) => this.toPersistence(dto));
  }
}