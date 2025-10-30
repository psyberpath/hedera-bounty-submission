export class CreateLogDto {
  userId: string;
  eventType: string;
  data: Record<string, any>;
}
